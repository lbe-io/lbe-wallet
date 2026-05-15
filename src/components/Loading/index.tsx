import React from 'react';
import { Spin, Flex } from 'antd';
import type { SpinProps } from 'antd';
import { useAppSelector } from '@/popup/hooks/redux';

export interface SpiningProps {
  loading: boolean;
  style?: React.CSSProperties;
}

export const Loading: React.FC<SpinProps> = (props) => {
  const { isLoading } = useAppSelector((state) => state.application);
  return <Spin spinning={isLoading} indicator={<span className="lbe-loading-indicator" />} {...props} />;
};

export const Spining: React.FC<SpiningProps> = ({ loading, style }) => {
  return (
    <Flex style={{ height: 'calc(100% - 103px)', width: 360, ...style }} align="center" justify="center">
      <Loading spinning={loading} />
    </Flex>
  );
};

export default Loading;
