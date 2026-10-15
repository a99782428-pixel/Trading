export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  country: string;
  address?: string;
  city?: string;
  postalCode?: string;
  nationality?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  driveFileId?: string;
  verificationStatus: 'pending' | 'verified' | 'unverified';
  accountType: 'live' | 'demo';
  liveBalance: number;
  demoBalance: number;
  onboardingStep: number;
  onboardingCompleted: boolean;
  role: 'user' | 'owner';
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionnaireAnswers {
  q1_age?: string;
  q2_profession?: string;
  q3_tradingExperience?: string;
  q4_marketKnowledge?: string;
  q5_investmentGoals?: string;
  q6_riskTolerance?: string;
  q7_timeHorizon?: string;
  completedAt?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type?: 'bank' | 'crypto' | 'card';
  category: 'main' | 'alternative';
  bankName: string;
  accountNumber: string;
  accountOwnerName: string;
  currency: string;
  exchangeRate: number;
  minDeposit: number;
  maxDeposit: number;
  instructions: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DepositRequest {
  requestId: string;
  userId: string;
  userEmail: string;
  usdAmount: number;
  convertedAmount: number;
  currency: string;
  paymentMethodId: string;
  paymentMethodName: string;
  confirmationPasscode: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface WithdrawalRequest {
  requestId: string;
  userId: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  fee: number;
  status: 'pending' | 'processed' | 'rejected';
  createdAt: string;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  pair: string;
  price: number;
  change24h: number;
  sparkline: number[];
  high24h: number;
  low24h: number;
  volume: string;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderMode: 'MARKET' | 'LIMIT';
  entryPrice: number;
  currentPrice: number;
  lotSize: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  duration: string;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  accountType: 'live' | 'demo';
  openedAt: string;
  closedAt?: string;
}

export interface AuditLogItem {
  logId: string;
  ownerUid: string;
  action: string;
  target: string;
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  timestamp: string;
}
