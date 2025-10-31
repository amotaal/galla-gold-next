// components/providers/wallet.tsx
// Wallet Provider for GALLA.GOLD Next.js Application
// Purpose: Provide wallet data (balances, transactions) throughout the app
// Fetches data from server actions and provides refresh functions

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth';
import { getBalanceAction } from '@/server/actions/wallet';
import { getTransactionsAction } from '@/server/actions/transaction';
import { getGoldPriceAction } from '@/server/actions/gold';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Multi-currency balance type
 */
interface Balance {
  USD: number;
  EUR: number;
  GBP: number;
  EGP: number;
  SAR: number;
}

/**
 * Gold holdings type
 */
interface GoldHoldings {
  grams: number;
  averagePurchasePrice: number;
  currentValue: number; // Calculated based on current price
}

/**
 * Transaction type
 */
interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'buy_gold' | 'sell_gold' | 'physical_delivery';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  goldAmount?: number;
  goldPricePerGram?: number;
  createdAt: Date;
  completedAt?: Date;
  description: string;
}

/**
 * Wallet context interface
 */
interface WalletContextType {
  // Balance data
  balance: Balance | null;
  gold: GoldHoldings | null;
  totalValueUSD: number;
  
  // Gold price
  goldPrice: number; // Current price per gram in USD
  
  // Transactions
  transactions: Transaction[];
  
  // Loading states
  isLoadingBalance: boolean;
  isLoadingTransactions: boolean;
  isLoadingPrice: boolean;
  
  // Refresh functions
  refetchBalance: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
  refetchPrice: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// =============================================================================
// WALLET PROVIDER COMPONENT
// =============================================================================

/**
 * WalletProvider - Wraps the app and provides wallet state
 * 
 * This provider fetches wallet data from server actions and makes it
 * available throughout the app. It automatically fetches data when the
 * user logs in and provides refresh functions to update data.
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * <WalletProvider>
 *   {children}
 * </WalletProvider>
 * ```
 * 
 * @param children - Child components to wrap
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // State
  const [balance, setBalance] = useState<Balance | null>(null);
  const [gold, setGold] = useState<GoldHoldings | null>(null);
  const [totalValueUSD, setTotalValueUSD] = useState(0);
  const [goldPrice, setGoldPrice] = useState(65); // Default price
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Loading states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  
  // =============================================================================
  // FETCH FUNCTIONS
  // =============================================================================
  
  /**
   * Fetch balance from server
   */
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingBalance(true);
    try {
      const result = await getBalanceAction();
      
      if (result.success && result.data) {
        setBalance(result.data.balance as Balance);
        setGold({
          grams: result.data.gold.grams,
          averagePurchasePrice: result.data.gold.averagePurchasePrice,
          currentValue: result.data.gold.grams * goldPrice,
        });
        setTotalValueUSD(result.data.totalValueUSD);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [isAuthenticated, goldPrice]);
  
  /**
   * Fetch transactions from server
   */
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingTransactions(true);
    try {
      const result = await getTransactionsAction();
      
      if (result.success && result.data) {
        setTransactions(result.data.transactions as Transaction[]);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isAuthenticated]);
  
  /**
   * Fetch current gold price from server
   */
  const fetchPrice = useCallback(async () => {
    setIsLoadingPrice(true);
    try {
      const result = await getGoldPriceAction();
      
      if (result.success && result.data) {
        setGoldPrice(result.data.pricePerGram);
      }
    } catch (error) {
      console.error('Failed to fetch gold price:', error);
      // Keep default price on error
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);
  
  /**
   * Fetch all data
   */
  const fetchAll = useCallback(async () => {
    await Promise.all([
      fetchBalance(),
      fetchTransactions(),
      fetchPrice(),
    ]);
  }, [fetchBalance, fetchTransactions, fetchPrice]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  /**
   * Fetch data when user authenticates
   */
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchAll();
    }
  }, [isAuthenticated, isAuthLoading, fetchAll]);
  
  /**
   * Auto-refresh gold price every minute
   */
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchPrice();
      }, 60000); // 60 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchPrice]);
  
  /**
   * Update gold current value when price changes
   */
  useEffect(() => {
    if (gold) {
      setGold(prev => prev ? {
        ...prev,
        currentValue: prev.grams * goldPrice,
      } : null);
    }
  }, [goldPrice, gold?.grams]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================
  
  const value: WalletContextType = {
    // Data
    balance,
    gold,
    totalValueUSD,
    goldPrice,
    transactions,
    
    // Loading states
    isLoadingBalance,
    isLoadingTransactions,
    isLoadingPrice,
    
    // Refresh functions
    refetchBalance: fetchBalance,
    refetchTransactions: fetchTransactions,
    refetchPrice: fetchPrice,
    refetchAll: fetchAll,
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * useWallet - Custom hook to access wallet context
 * 
 * Usage:
 * ```tsx
 * const { balance, gold, goldPrice, transactions, refetchAll } = useWallet();
 * 
 * // Display balance
 * <div>USD Balance: ${balance?.USD || 0}</div>
 * 
 * // Display gold
 * <div>Gold: {gold?.grams || 0}g @ ${goldPrice}/g</div>
 * 
 * // Refresh after transaction
 * await buyGoldAction(data);
 * await refetchAll();
 * ```
 * 
 * @returns WalletContextType - Wallet context
 * @throws Error if used outside WalletProvider
 */
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * useBalance - Get just the balance data
 */
export function useBalance() {
  const { balance, isLoadingBalance, refetchBalance } = useWallet();
  return { balance, isLoadingBalance, refetchBalance };
}

/**
 * useGold - Get just the gold data
 */
export function useGold() {
  const { gold, goldPrice, isLoadingPrice, refetchPrice } = useWallet();
  return { gold, goldPrice, isLoadingPrice, refetchPrice };
}

/**
 * useTransactions - Get just the transactions data
 */
export function useTransactions() {
  const { transactions, isLoadingTransactions, refetchTransactions } = useWallet();
  return { transactions, isLoadingTransactions, refetchTransactions };
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
 * BASIC USAGE:
 * 
 * import { useWallet } from '@/components/providers/wallet';
 * 
 * function BalanceCard() {
 *   const { balance, isLoadingBalance } = useWallet();
 *   
 *   if (isLoadingBalance) return <Skeleton />;
 *   
 *   return (
 *     <div>
 *       <p>USD: ${balance?.USD || 0}</p>
 *       <p>EUR: €{balance?.EUR || 0}</p>
 *     </div>
 *   );
 * }
 * 
 * 
 * GOLD DISPLAY:
 * 
 * const { gold, goldPrice } = useWallet();
 * 
 * return (
 *   <div>
 *     <p>Gold: {gold?.grams || 0}g</p>
 *     <p>Value: ${gold?.currentValue || 0}</p>
 *     <p>Current Price: ${goldPrice}/g</p>
 *   </div>
 * );
 * 
 * 
 * REFRESH AFTER TRANSACTION:
 * 
 * const { refetchAll } = useWallet();
 * 
 * const handleBuyGold = async (data) => {
 *   const result = await buyGoldAction(data);
 *   
 *   if (result.success) {
 *     await refetchAll(); // Refresh all wallet data
 *     toast({ title: 'Gold purchased successfully!' });
 *   }
 * };
 * 
 * 
 * TRANSACTIONS LIST:
 * 
 * const { transactions, isLoadingTransactions } = useWallet();
 * 
 * return (
 *   <div>
 *     {transactions.slice(0, 5).map(tx => (
 *       <div key={tx.id}>
 *         <p>{tx.type}: {tx.amount} {tx.currency}</p>
 *         <p>Status: {tx.status}</p>
 *       </div>
 *     ))}
 *   </div>
 * );
 */
