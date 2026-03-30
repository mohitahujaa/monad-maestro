"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet } from "@/lib/wagmi";
import { useEffect, useState } from "react";
import { Wallet, ChevronDown, AlertTriangle, Check } from "lucide-react";

interface WalletConnectProps {
  size?: "sm" | "md" | "lg";
  showNetwork?: boolean;
}

export function WalletConnect({ size = "md", showNetwork = true }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <button className={btnBase(size)} disabled>
        <Wallet className={iconSize(size)} />
        <span>Connect Wallet</span>
      </button>
    );
  }

  const isWrongNetwork = isConnected && chainId !== monadTestnet.id;

  if (isConnected && address) {
    return (
      <div className="relative">
        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: monadTestnet.id })}
            disabled={isSwitching}
            className={`${btnBase(size)} bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20`}
          >
            <AlertTriangle className={iconSize(size)} />
            <span>{isSwitching ? "Switching..." : "Switch to Monad"}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`${btnBase(size)} bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20`}
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-mono">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            {showNetwork && (
              <span className="text-white/40 border-l border-white/10 pl-2 text-[10px]">
                Monad
              </span>
            )}
            <ChevronDown className={`${iconSize(size)} text-white/40`} />
          </button>
        )}

        {showMenu && !isWrongNetwork && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-40 min-w-[200px] bg-[#0f0f13] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-white/[0.06]">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Connected</p>
                <p className="text-xs font-mono text-white/80 break-all">{address}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Monad Testnet</span>
                </div>
              </div>
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className={`${btnBase(size)} bg-[#a855f7]/10 border-[#a855f7]/40 text-[#a855f7] hover:bg-[#a855f7]/20 hover:border-[#a855f7]/60`}
    >
      <Wallet className={iconSize(size)} />
      <span>{isPending ? "Connecting…" : "Connect Wallet"}</span>
    </button>
  );
}

function btnBase(size: "sm" | "md" | "lg") {
  const sizes = {
    sm: "text-[10px] px-2.5 py-1.5 gap-1.5",
    md: "text-xs px-3 py-2 gap-2",
    lg: "text-sm px-4 py-2.5 gap-2",
  };
  return `inline-flex items-center rounded-lg border font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]}`;
}

function iconSize(size: "sm" | "md" | "lg") {
  return size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4";
}

/** Inline gate: renders children only when wallet connected, else renders wallet button */
export function WalletGate({
  children,
  message = "Connect your wallet to continue",
}: {
  children: React.ReactNode;
  message?: string;
}) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-[#a855f7]" />
        </div>
        <div>
          <p className="text-white/80 font-medium">{message}</p>
          <p className="text-white/40 text-sm mt-1">Your wallet is required to interact with Monad.</p>
        </div>
        <WalletConnect size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
