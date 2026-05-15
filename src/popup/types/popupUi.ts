import type { CollapseProps, FormInstance } from 'antd';
import type { RefObject } from 'react';
import type { WalletController } from '@/app/contexts/walletContext';
import type { Account, Address, Chain, ChainRpc, ChainToken, Wallet } from '@/cosmos/storage';
import type { GasOption } from '@/components/gasInfo';
import type { CosmosTxHistoryItem } from '@/entrypoints/background/service/keyring/types';
import type { WalletModalContextValue, WalletNetworkScope, WalletRefreshAction, WalletSelectedCrypto } from '@/popup/types/walletUi';
import type { CosmosSendResult } from '@/popup/utils/cosmosSend';

export type PopupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type PopupDialogProps = {
  open: boolean;
  onClose: () => void;
};

export type PopupCloseHandler<TResult = void> = (result?: TResult) => void;

export type PopupPageParams<TResult = void> = {
  isOpen: boolean;
  onClose: PopupCloseHandler<TResult>;
};

export type PopupSearchValueSetter = (value: string) => void;

export type PopupBooleanSetter = (value: boolean) => void;

export type PopupSearchListResult<T> = {
  searchValue: string;
  setSearchValue: PopupSearchValueSetter;
  filteredList: T[];
  isSearching: boolean;
  isEmpty: boolean;
};

export type PopupSiteInfo = {
  origin?: string;
  name?: string;
  icon?: string;
};

export type PopupWalletAccountMatch = {
  wallet?: Wallet;
  account?: Account;
};

export type PopupRecordChainInfo = {
  chainId: string;
  name: string;
  icon?: string;
};

export type PopupRecordHistoryGroup = {
  time: number;
  formatTime: string;
  tx: CosmosTxHistoryItem[];
};

export type WalletEditAccountWithBalance = Account & {
  balance: number;
};

export type WalletEditWalletGroup = {
  key: string;
  name: string;
  balance: number;
  accounts: WalletEditAccountWithBalance[];
  wallet: Wallet;
};

export type SelectAddressCollapseGroup = {
  key: string;
  name: string;
  balance: number;
  accounts: string[];
  wallet: Wallet;
};

export type SendFlowSelectedAccountLike = {
  wid?: string;
  index?: number | string;
};

export type SendFlowSuccessHandler = (result: CosmosSendResult) => void;
export type SendFlowCloseHandler = () => void;

export type SendFlowStep = 'selectAddress' | 'sendAmount' | 'sendInfo';

export type SendFlowTarget = {
  token: WalletSelectedCrypto;
  toAddress: string;
};

export type SendFlowAmountStep = SendFlowTarget & {
  amount: string;
};

export type SendFlowAmountInputState = {
  amount: string;
  fontSize: number;
};

export type SendInfoContextData = {
  chainName: string;
  fromAddressIsMine: PopupWalletAccountMatch | null;
  toAddressIsMine: PopupWalletAccountMatch | null;
};

export type SendInfoContextInput = {
  token: ChainToken | null;
  toAddress: string;
};

export type SendFlowSubmitInput = {
  walletController: WalletController;
  token: ChainToken;
  amount: string;
  toAddress: string;
  selectedAccount?: SendFlowSelectedAccountLike | null;
  selectedFee: GasOption | null;
};

export type SelectAddressViewModelResult = {
  form: FormInstance;
  collapses: SelectAddressCollapseGroup[];
  items: CollapseProps['items'];
  toAddress: string;
  currentStep: SendFlowStep;
  openSendAmount: boolean;
  closeCurrentStep: SendFlowCloseHandler;
  openNextStep: () => void;
  closeNextStep: () => void;
  handleSubmit: () => void;
  handleSendSuccess: SendFlowSuccessHandler;
  handleValidator: (_: unknown, value: string) => Promise<void>;
  sendAmountStep: SendFlowTarget;
};

export type SelectAddressFormStateResult = {
  form: FormInstance;
  toAddress: string;
  handleValidator: (_: unknown, value: string) => Promise<void>;
  handleSubmit: () => void;
  handleQuickSelect: (address: string) => void;
};

export type SendAmountViewModelResult = {
  uiState: SendAmountUiStateResult;
  searchValue: string;
  setSearchValue: PopupSearchValueSetter;
  amount: string;
  fontSize: number;
  textWidth: number;
  openDrawer: boolean;
  setOpenDrawer: PopupBooleanSetter;
  currentStep: SendFlowStep;
  openSendInfo: boolean;
  closeCurrentStep: SendFlowCloseHandler;
  openNextStep: () => void;
  closeNextStep: () => void;
  formattedTokenAmount: string;
  handleChange: (event: { target: { value: unknown } }) => void;
  handleMax: () => void;
  sendInfoStep: SendFlowAmountStep;
  handleSendInfoSuccess: SendFlowSuccessHandler;
};

export type SendAmountUiStateResult = {
  inputRef: RefObject<any>;
  searchValue: string;
  setSearchValue: PopupSearchValueSetter;
  amount: string;
  fontSize: number;
  textWidth: number;
  openDrawer: boolean;
  setOpenDrawer: PopupBooleanSetter;
  handleChange: (event: { target: { value: unknown } }) => void;
  handleMax: () => void;
};

export type SendInfoViewModelResult = SendInfoContextData & {
  feeSelection: SendFeeSelectionResult;
  selectedFee: GasOption | null;
  setSelectedFee: (fee: GasOption | null) => void;
  submitting: boolean;
  numericAmount: number;
  displayAmount: string;
  networkFeeLabel: string;
  confirmDisabled: boolean;
  handleConfirm: () => Promise<void>;
};

export type SendFeeSelectionResult = {
  selectedFee: GasOption | null;
  setSelectedFee: (fee: GasOption | null) => void;
  submitting: boolean;
  runWithSubmitting: <T>(task: () => Promise<T>) => Promise<T>;
};

export type GasInfoUiStateResult = {
  openNetworkFee: boolean;
  setOpenNetworkFee: PopupBooleanSetter;
  fadeInClass: string;
  selectedFee: GasOption | null;
  setSelectedFee: (fee: GasOption | null) => void;
};

export type NetworkFeeModalProps = PopupModalProps & {
  fadeInClass: string;
  networkFees: GasOption[];
  selectFee: GasOption;
  changeNetworkFee: (networkFee: GasOption) => void;
};

export type NetworkFeeViewModelResult = {
  form: FormInstance;
  fadeClass: string;
  selectedCustomFee: string;
  customFees: GasOption[];
  handleSelect: (fee: GasOption) => void;
  handleValidator: () => Promise<void>;
  handleSubmit: () => void;
  handleClose: () => void;
};

export type NetworkEditInfo = Partial<Chain & ChainRpc> & {
  blockExplorer?: string;
  url?: string;
};

export type ManageCryptoViewModelResult = WalletNetworkScope & {
  showList: boolean;
  showMore: boolean;
  page: number;
  currencyList: ChainToken[];
  selectedCurrencyList: ChainToken[];
  searchValue: string;
  setSearchValue: PopupSearchValueSetter;
  searchCurrencyList: ChainToken[];
  isSearching: boolean;
  isEmpty: boolean;
  refreshData: WalletRefreshAction;
  updateToken: (chainToken: ChainToken) => void;
};

export type SendSelectCryptoViewModelResult = {
  filteredList: ChainToken[];
  setSearchValue: PopupSearchValueSetter;
  openSelectAddress: boolean;
  setOpenSelectAddress: PopupBooleanSetter;
  selectedCrypto: WalletSelectedCrypto;
  openNetwork: boolean;
  defaultNetworks: Chain[];
  network: Chain | null;
  onSelectCurrency: (nextCrypto: ChainToken) => void;
  onSelectNetwork: (chain: Chain | undefined) => void;
};

export type CryptoDetailViewModelResult = {
  currentToken: ChainToken | null;
  tokenTx: Record<string, any>[];
  tabs: any[];
  tab: number;
  setTab: (nextTab: number) => void;
  openSelectAddress: boolean;
  setOpenSelectAddress: PopupBooleanSetter;
  openReceiveQrcode: boolean;
  setOpenReceiveQrcode: PopupBooleanSetter;
  currentAddress: string;
  currentPriceUsd: number;
  liveAmount: number;
  liveBalanceUsd: number;
  priceChangePercent24h: number | null;
  openSend: WalletRefreshAction;
  openReceive: WalletRefreshAction;
};

export type WalletAddressListViewModelResult = Pick<WalletModalContextValue, 'selectedAccount' | 'activeChainId'> & {
  searchValue: string;
  setSearchValue: PopupSearchValueSetter;
  addresses: Address[];
  openQrcode: boolean;
  setOpenQrcode: PopupBooleanSetter;
  openNetwork: boolean;
  setOpenNetwork: PopupBooleanSetter;
  selectedAddress: Address | null;
  selectedNetwork: Chain | null;
  onSelectAddress: (address: Address) => void;
  onSelectNetwork: (chain: Chain | undefined) => void;
};

export type ReceiveQrcodeViewModelResult = {
  address: string;
  resolvedChainId: string;
};

export type SelectAddressModalProps = PopupModalProps & {
  token: ChainToken | null;
};

export type SendSelectCryptoModalProps = PopupModalProps;

export type ManageCryptoModalProps = PopupModalProps;

export type CryptoDetailModalProps = PopupModalProps & {
  selectedCrypto: WalletSelectedCrypto;
};

export type ReceiveQrcodeModalProps = PopupModalProps & {
  crypto?: Address | null;
  network?: Chain | null;
};

export type AddressCopyModalProps = PopupModalProps;

export type SelectCryptoModalProps = {
  isOpen: boolean;
  type: string;
  onClose: (crypto?: ChainToken) => void;
};

export type RecordModalProps = PopupModalProps;

export type WalletEditModalProps = PopupModalProps;

export type CustomCryptoModalProps = PopupPageParams<boolean>;

export type NetworkModalProps = {
  isOpen: boolean;
  showTab: boolean;
  defaultNetworks?: Chain[];
  onClose: PopupCloseHandler<Chain>;
};

export type NetworkEditModalProps = PopupPageParams<boolean> & {
  networkInfo: NetworkEditInfo;
  isAdd: boolean;
};

export type SendAmountModalProps = PopupModalProps & {
  toAddress: string;
  token: WalletSelectedCrypto;
  onSuccess?: SendFlowSuccessHandler;
};

export type SendInfoModalProps = PopupModalProps & {
  toAddress: string;
  amount: string;
  token: WalletSelectedCrypto;
  onSuccess?: SendFlowSuccessHandler;
};

export type SettingsModalProps = PopupModalProps;

export type SeedModalProps = PopupModalProps & {
  account?: Account;
  wallet?: Wallet;
};

export type AccountDetailsModalProps = PopupModalProps & {
  account?: Account;
  wallet?: Wallet;
  onAccountRenamed?: (account: Account) => void;
};

export type PrivateKeyListModalProps = PopupModalProps & {
  account?: Account;
  wallet?: Wallet;
};

export type RenameAccountModalProps = PopupModalProps & {
  account?: Account;
  maxLength?: number;
  onRenamed?: (account: Account) => void;
};

export type SecretRecoveryPhraseDialogProps = PopupDialogProps & {
  locale?: 'en' | 'zh-CN' | 'zh-TW';
};
