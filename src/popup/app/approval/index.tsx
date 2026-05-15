import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApproval } from '@/app/hooks';
import { useWallet } from '@/app/contexts';

import * as ApprovalComponent from '@/popup/app/approval/component';
import { isApprovalRecoveryInput } from '@/shared/messaging/providerBridgeProtocol';
import { isApprovalRoutePayload, toApprovalTask, type ApprovalTask, type ApprovalTaskByComponent, type ApprovalRootComponentName } from '@/popup/types/approvalUi';
import './index.css';

type ApprovalComponentMap = {
  [K in ApprovalRootComponentName]: (props: { params: ApprovalTaskByComponent[K]['params']; origin?: string; requestDefer?: Promise<unknown> }) => ReactElement;
};

export default function ApprovalScreen() {
  const [getApproval] = useApproval();
  const wallet = useWallet();

  const [approval, setApproval] = useState<ApprovalTask | null>(null);

  const navigate = useNavigate();

  const init = async () => {
    const approvalRecovery = await wallet.getApprovalRecovery();
    const approvalPayload = isApprovalRecoveryInput(approvalRecovery) ? approvalRecovery.payload : await getApproval();
    if (!isApprovalRoutePayload(approvalPayload)) {
      navigate('/');
      return null;
    }

    const nextApproval: ApprovalTask = toApprovalTask(approvalPayload);
    setApproval(nextApproval);
  };

  useEffect(() => {
    init();
  }, []);

  if (!approval) return <></>;
  const { approvalComponent, params, origin, requestDefer } = approval;
  const components = ApprovalComponent as ApprovalComponentMap;

  switch (approvalComponent) {
    case 'Connect':
      return <components.Connect params={params} origin={origin} requestDefer={requestDefer} />;
    case 'CosmosSign':
      return <components.CosmosSign params={params} origin={origin} requestDefer={requestDefer} />;
    case 'CosmosSendTx':
      return <components.CosmosSendTx params={params} origin={origin} requestDefer={requestDefer} />;
    default:
      return <></>;
  }
}
