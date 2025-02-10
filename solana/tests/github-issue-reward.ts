import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GithubIssueReward } from "../target/types/github_issue_reward";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("github-issue-reward", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GithubIssueReward as Program<GithubIssueReward>;
  
  // テスト用のアカウント
  const owner = anchor.web3.Keypair.generate();
  const signer = anchor.web3.Keypair.generate();
  const privilegedAccount = anchor.web3.Keypair.generate();
  const contributor = anchor.web3.Keypair.generate();
  
  // テスト用の状態変数
  let mint: anchor.web3.PublicKey;
  let ownerToken: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let state: anchor.web3.PublicKey;
  let issue: anchor.web3.PublicKey;
  let vaultAuthority: anchor.web3.PublicKey;
  let vaultBump: number;

  const repositoryName = "example/repo";
  const issueId = new anchor.BN(1);
  const reward = new anchor.BN(100_000_000); // 0.1 tokens

  before(async () => {
    // テスト用アカウントにSOLを転送
    const ownerAirdropSignature = await provider.connection.requestAirdrop(
      owner.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(ownerAirdropSignature);

    const contributorAirdropSignature = await provider.connection.requestAirdrop(
      contributor.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(contributorAirdropSignature);

    // 署名者のアカウントにもSOLを転送
    const signerAirdropSignature = await provider.connection.requestAirdrop(
      signer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signerAirdropSignature);

    // テスト用トークンの作成
    mint = await createMint(
      provider.connection,
      owner,
      owner.publicKey,
      null,
      9
    );

    // オーナーのトークンアカウント作成
    ownerToken = await createAccount(
      provider.connection,
      owner,
      mint,
      owner.publicKey,
      owner
    );

    // テスト用トークンの発行
    await mintTo(
      provider.connection,
      owner,
      mint,
      ownerToken,
      owner.publicKey,
      1000_000_000_000, // 1000 tokens
      [owner]
    );

    // PDAsの生成
    [vaultAuthority, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault")],
      program.programId
    );

    // プログラムのステートアカウント
    [state] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("state")],
      program.programId
    );

    // Vaultアカウントの作成
    vault = await createAccount(
      provider.connection,
      owner,
      mint,
      vaultAuthority,
      owner
    );
  });

  it("Initialize program", async () => {
    await program.methods
      .initialize(signer.publicKey, privilegedAccount.publicKey)
      .accounts({
        state,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const stateAccount = await program.account.programState.fetch(state);
    assert.ok(stateAccount.owner.equals(owner.publicKey));
    assert.ok(stateAccount.signerAddress.equals(signer.publicKey));
    assert.ok(stateAccount.privilegedAccount.equals(privilegedAccount.publicKey));
  });

  it("Lock reward", async () => {
    // イシューアカウントのPDA生成
    [issue] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(repositoryName),
        issueId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    await program.methods
      .lockReward(repositoryName, issueId, reward)
      .accounts({
        user: owner.publicKey,
        userToken: ownerToken,
        vault,
        tokenMint: mint,
        issue,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const issueAccount = await program.account.issue.fetch(issue);
    assert.equal(issueAccount.reward.toString(), reward.toString());
    assert.ok(issueAccount.tokenMint.equals(mint));
    assert.equal(issueAccount.repositoryName, repositoryName);
    assert.equal(issueAccount.issueId.toString(), issueId.toString());
    assert.equal(issueAccount.isCompleted, false);
  });

  it("Register and complete issue", async () => {
    const githubIds = ["contributor1"];
    const percentages = [100];

    await program.methods
      .registerAndCompleteIssue(githubIds, percentages)
      .accounts({
        user: privilegedAccount.publicKey,
        state,
        issue,
      })
      .signers([privilegedAccount])
      .rpc();

    const issueAccount = await program.account.issue.fetch(issue);
    assert.equal(issueAccount.isCompleted, true);
    assert.deepEqual(issueAccount.contributors, githubIds);
    assert.deepEqual(issueAccount.contributorPercentages, percentages);
  });

  it("Claim reward", async () => {
    // コントリビューターのトークンアカウント作成
    const contributorToken = await createAccount(
      provider.connection,
      contributor,
      mint,
      contributor.publicKey,
      contributor
    );

    // 署名の生成部分を一時的に固定値に
    const signature = Buffer.alloc(64, 1); // 64バイトの署名を1で埋める

    await program.methods
      .claimReward("contributor1", signature)
      .accounts({
        claimer: contributor.publicKey,
        claimerToken: contributorToken,
        vault,
        vaultAuthority,
        issue,
        state,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([contributor])
      .rpc();

    const contributorTokenAccount = await getAccount(
      provider.connection,
      contributorToken
    );
    assert.equal(contributorTokenAccount.amount.toString(), reward.toString());
  });
});