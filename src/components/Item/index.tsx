import React from 'react';
import { Flex, Avatar, Button, Typography, Tag, Statistic } from 'antd';
import { EllipsisOutlined, PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { AppIcon } from '@/assets/icon';
import { shortAddress } from '@/shared/common';
import MoreVertical from '@/assets/icon/moreVertical.svg';
import { formatTokenAmount } from '@/shared/common';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

interface ItemProps {
  type: 'token' | 'rpcNetwork' | 'address' | 'manageCrypto' | 'record' | 'balance' | 'wallet' | 'network' | 'crypto' | 'selectAddress' | 'account';
  name?: string;
  fname?: string;
  icon?: string;
  amount?: string;
  balance?: string | number;
  describe?: string | number;
  address?: string;
  selected?: boolean;
  isMultiToken?: boolean;
  recordValue?: string;
  isSend?: boolean;
  rightBtn?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const Item: React.FC<ItemProps> = ({ type, name, fname, icon, amount, balance, describe, selected, isMultiToken, recordValue, isSend, rightBtn, onClick }) => {
  const { t } = useTranslation();

  const handleRightBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    rightBtn?.(e);
  };

  const renderContent = () => {
    switch (type) {
      case 'wallet':
        return (
          <Flex align="center">
            <Avatar {...(icon && { src: icon })} size={36} className={`ui-token-avatar-36 item-avatar ${icon ? '' : 'item-avatar-fallback'}`}>
              {name?.[0]?.toUpperCase()}
            </Avatar>
            <Flex className="item-content-margin" vertical>
              <Text className="item-title">{name}</Text>
            </Flex>
          </Flex>
        );
      case 'token':
      case 'manageCrypto':
      case 'address':
      case 'crypto':
        return (
          <Flex align="center">
            <Avatar {...(icon && { src: icon })} size={36} className={`ui-token-avatar-36 item-avatar ${icon ? '' : 'item-avatar-fallback'}`}>
              {name?.[0]?.toUpperCase()}
            </Avatar>
            <Flex className="item-content-margin" vertical>
              <Flex>
                <Text className="item-title">{name}</Text>
                {isMultiToken && <Tag className="item-multi-tag">{t('common.multichain')}</Tag>}
              </Flex>
              <Text className="item-subtitle">{`${type === 'token' ? '$' : ''}${type === 'token' ? describe : shortAddress(describe, 15)}`}</Text>
            </Flex>
          </Flex>
        );
      case 'record':
        return (
          <Flex align="center">
            <Avatar {...(icon && { src: icon })} size={36} className={`ui-token-avatar-36 item-avatar ${icon ? '' : 'item-avatar-fallback'}`}>
              {fname?.[0]?.toUpperCase()}
            </Avatar>
            <Flex className="item-content-margin" vertical>
              <Flex>
                <Text className="item-title">{name}</Text>
              </Flex>
              <Text className="item-record-subtitle">{`${describe}`}</Text>
            </Flex>
          </Flex>
        );
      case 'network':
      case 'rpcNetwork':
        return (
          <Flex align="center">
            <Avatar {...(icon && { src: icon })} size={36} className={`ui-token-avatar-36 item-avatar ${icon ? '' : 'item-avatar-fallback'}`}>
              {name?.[0]?.toUpperCase()}
            </Avatar>
            <Flex className="item-content-margin">
              <Text className="item-title">{name}</Text>
            </Flex>
          </Flex>
        );
      case 'selectAddress':
        return (
          <Flex align="center">
            <Text>{name}</Text>
          </Flex>
        );
      case 'account':
        return (
          <Flex align="center">
            <Text className="item-account-title">{name}</Text>
          </Flex>
        );
      default:
        return null;
    }
  };
  const amountDisplay = type === 'token' || type === 'crypto' ? formatTokenAmount(amount) : amount;

  const renderContentRight = () => {
    switch (type) {
      case 'token':
      case 'crypto':
        return (
          <Flex vertical align="flex-end">
            <Text className="item-title">{amountDisplay}</Text>
            <Flex align="center">
              <span className="item-stat-prefix">$</span>
              <Statistic precision={2} valueStyle={{ fontSize: 12, fontWeight: 400, color: '#86909C' }} value={balance} />
            </Flex>
          </Flex>
        );
      case 'wallet':
        return (
          <Flex align="center" gap={16}>
            <Text className="item-subtitle">{`${describe}`}</Text>
            <Button icon={<img src={MoreVertical} alt="More options" className="item-more-icon" />} size="small" type="text" onClick={handleRightBtnClick} />
          </Flex>
        );
      case 'network':
      case 'selectAddress':
        return selected ? <AppIcon name="SelectedIcon" /> : null;
      case 'manageCrypto':
        return selected ? <MinusCircleOutlined className="item-manage-minus" onClick={handleRightBtnClick} /> : <PlusCircleOutlined className="item-manage-plus" onClick={handleRightBtnClick} />;
      case 'rpcNetwork':
        return <EllipsisOutlined className="item-rpc-more" onClick={handleRightBtnClick} />;
      case 'address':
        return <Button type="text" shape="circle" size="small" icon={<AppIcon name="CopeSedIcon" className="item-copy-icon" />} onClick={handleRightBtnClick} />;
      case 'record':
        return <Text className={`item-record-value ${isSend ? 'item-record-value-send' : 'item-record-value-receive'}`}>{recordValue}</Text>;
      case 'account':
        return (
          <Flex align="center" gap={8}>
            <Text className="item-account-desc">{describe}</Text>
            <AppIcon name="RightIcon" />
          </Flex>
        );
      default:
        return null;
    }
  };

  return (
    <Flex className={`item-card ${selected ? 'item-card-selected' : ''}`} align="center" justify="space-between" gap={8} onClick={onClick}>
      {renderContent()}
      {renderContentRight()}
    </Flex>
  );
};

export default Item;
