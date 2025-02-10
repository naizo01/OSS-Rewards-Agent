// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GithubIssueReward } from "../target/types/github_issue_reward";
import { Keypair } from "@solana/web3.js";

module.exports = async function (provider: anchor.Provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Get the program
  const program = anchor.workspace.GithubIssueReward as Program<GithubIssueReward>;

  try {
    // Generate initial accounts
    const owner = (provider.wallet as any).payer as Keypair;
    const signer = Keypair.generate();
    const privilegedAccount = Keypair.generate();

    // Generate PDA for the program's state account
    const [state] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("state")],
      program.programId
    );

    console.log("Deploying program...");
    console.log("Program ID:", program.programId.toString());
    console.log("Owner:", owner.publicKey.toString());
    console.log("Signer:", signer.publicKey.toString());
    console.log("Privileged Account:", privilegedAccount.publicKey.toString());

    // Initialize the program
    await program.methods
      .initialize(signer.publicKey, privilegedAccount.publicKey)
      .accounts({
        state,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("Program deployed successfully!");
    console.log("State Account:", state.toString());

    // Save important account information
    const deployInfo = {
      programId: program.programId.toString(),
      owner: owner.publicKey.toString(),
      signer: signer.publicKey.toString(),
      privilegedAccount: privilegedAccount.publicKey.toString(),
      state: state.toString(),
    };

    // Save to JSON file
    const fs = require("fs");
    fs.writeFileSync(
      "deploy-info.json",
      JSON.stringify(deployInfo, null, 2)
    );
    console.log("Deployment info saved to deploy-info.json");

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
};
