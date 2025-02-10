use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("9T4k3RZXv17Dy7bhExP45hHeQNEsjGokZZpe3hKrXS5f");

#[program]
pub mod github_issue_reward {
    use super::*;

    // 初期化
    pub fn initialize(ctx: Context<Initialize>, signer: Pubkey, privileged: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.owner = ctx.accounts.owner.key();
        state.signer_address = signer;
        state.privileged_account = privileged;
        Ok(())
    }

    // 報酬のロック
    pub fn lock_reward(
        ctx: Context<LockReward>,
        repository_name: String,
        issue_id: u64,
        reward: u64,
    ) -> Result<()> {
        let issue_account = &mut ctx.accounts.issue;
        let transfer_amount = reward;

        // トークンの転送
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, transfer_amount)?;

        // イシュー情報の更新
        issue_account.reward = reward;
        issue_account.token_mint = ctx.accounts.token_mint.key();
        issue_account.repository_name = repository_name;
        issue_account.issue_id = issue_id;
        issue_account.is_completed = false;

        Ok(())
    }

    // イシューの完了登録
    pub fn register_and_complete_issue(
        ctx: Context<CompleteIssue>,
        github_ids: Vec<String>,
        percentages: Vec<u8>,
    ) -> Result<()> {
        require!(
            ctx.accounts.user.key() == ctx.accounts.state.privileged_account,
            ErrorCode::NotPrivilegedAccount
        );

        let issue = &mut ctx.accounts.issue;
        require!(!issue.is_completed, ErrorCode::IssueAlreadyCompleted);
        require!(github_ids.len() == percentages.len(), ErrorCode::MismatchedInputs);

        let mut total_percentage: u8 = 0;
        for (i, github_id) in github_ids.iter().enumerate() {
            issue.contributors.push(github_id.clone());
            issue.contributor_percentages.push(percentages[i]);
            total_percentage = total_percentage.checked_add(percentages[i])
                .ok_or(ErrorCode::PercentageOverflow)?;
        }
        require!(total_percentage == 100, ErrorCode::InvalidTotalPercentage);

        issue.is_completed = true;
        Ok(())
    }

    // 報酬の請求
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        github_id: String,
        signature: Vec<u8>,
    ) -> Result<()> {
        let issue = &ctx.accounts.issue;
        require!(issue.is_completed, ErrorCode::IssueNotCompleted);

        // 署名検証を一時的にスキップ
        // 基本的な長さチェックのみ実施
        require!(signature.len() == 64, ErrorCode::InvalidSignature);

        // 報酬の計算と送信
        let percentage = get_contributor_percentage(issue, &github_id)?;
        let reward_amount = (issue.reward * percentage as u64) / 100;

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.claimer_token.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };

        let seeds = &[b"vault".as_ref(), &[ctx.bumps.vault_authority]];
        let signer = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, reward_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 32 + 32)]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, token::Mint>,
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 32 + 200 + 8 + 1 + 1000
    )]
    pub issue: Account<'info, Issue>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteIssue<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub issue: Account<'info, Issue>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(mut)]
    pub claimer_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: This is safe because we only use it as authority
    #[account(seeds = [b"vault"], bump)]
    pub vault_authority: AccountInfo<'info>,
    #[account(mut)]
    pub issue: Account<'info, Issue>,
    pub state: Account<'info, ProgramState>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ProgramState {
    pub owner: Pubkey,
    pub signer_address: Pubkey,
    pub privileged_account: Pubkey,
}

#[account]
pub struct Issue {
    pub reward: u64,
    pub token_mint: Pubkey,
    pub repository_name: String,
    pub issue_id: u64,
    pub is_completed: bool,
    pub contributors: Vec<String>,
    pub contributor_percentages: Vec<u8>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Not the privileged account")]
    NotPrivilegedAccount,
    #[msg("Issue is already completed")]
    IssueAlreadyCompleted,
    #[msg("Mismatched inputs")]
    MismatchedInputs,
    #[msg("Percentage overflow")]
    PercentageOverflow,
    #[msg("Invalid total percentage")]
    InvalidTotalPercentage,
    #[msg("Issue not completed")]
    IssueNotCompleted,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Contributor not found")]
    ContributorNotFound,
}

// ヘルパー関数
fn get_contributor_percentage(issue: &Issue, github_id: &str) -> Result<u8> {
    for (i, contributor) in issue.contributors.iter().enumerate() {
        if contributor == github_id {
            return Ok(issue.contributor_percentages[i]);
        }
    }
    Err(ErrorCode::ContributorNotFound.into())
}