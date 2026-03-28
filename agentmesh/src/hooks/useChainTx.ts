"use client";

/**
 * wagmi hooks for real on-chain interactions using native MON.
 * Every call goes through the user's MetaMask on Monad Testnet.
 */

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { keccak256, toBytes, formatEther } from "viem";
import { useEffect, useState } from "react";
import {
  CONTRACTS,
  AGENT_REGISTRY_ABI,
  TASK_ESCROW_ABI,
  toMonWei,
} from "@/lib/contracts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a string ID → bytes32 via keccak256 (same as ethers.id()) */
export function toBytes32(id: string): `0x${string}` {
  return keccak256(toBytes(id));
}

// ─── MON Balance ──────────────────────────────────────────────────────────────

export function useMonBalance(address: `0x${string}` | undefined) {
  const { data, refetch } = useBalance({
    address,
    query: { enabled: !!address },
  });
  const balance = data ? Number(formatEther(data.value)).toFixed(4) : "0.0000";
  return { balance, rawValue: data?.value, refetch };
}

// ─── Agent Registration ───────────────────────────────────────────────────────

export interface RegisterAgentArgs {
  agentId: string;
  skills: string[];
  costPerTask: number;  // MON amount
  metadata: string;
}

export function useRegisterAgent() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = ({ agentId, skills, costPerTask, metadata }: RegisterAgentArgs) => {
    writeContract({
      address: CONTRACTS.AGENT_REGISTRY,
      abi: AGENT_REGISTRY_ABI,
      functionName: "registerAgent",
      args: [toBytes32(agentId), skills, toMonWei(costPerTask), metadata],
    });
  };

  return { register, hash, isPending, isConfirming, isSuccess, error, reset };
}

// ─── Task Escrow (single tx — send native MON) ────────────────────────────────

export type EscrowStep = "idle" | "waiting_wallet" | "confirming" | "done" | "error";

export function useTaskEscrow() {
  const [step, setStep] = useState<EscrowStep>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Track state transitions
  useEffect(() => {
    if (isPending) setStep("waiting_wallet");
  }, [isPending]);

  useEffect(() => {
    if (hash && !isSuccess) setStep("confirming");
  }, [hash, isSuccess]);

  useEffect(() => {
    if (isSuccess) setStep("done");
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      setStep("error");
      const e = error as unknown as { shortMessage?: string; message?: string };
      setErrorMsg(e.shortMessage ?? e.message?.split("\n")[0] ?? "Transaction failed");
    }
  }, [error]);

  const lockFunds = (taskId: string, amountMon: number) => {
    setStep("waiting_wallet");
    setErrorMsg(null);
    writeContract({
      address: CONTRACTS.TASK_ESCROW,
      abi: TASK_ESCROW_ABI,
      functionName: "createTask",
      args: [toBytes32(taskId)],
      value: toMonWei(amountMon),
    });
  };

  const reset = () => {
    setStep("idle");
    setErrorMsg(null);
  };

  return {
    lockFunds,
    reset,
    step,
    hash,
    isLoading: isPending || isConfirming,
    isDone: isSuccess,
    errorMsg,
  };
}
