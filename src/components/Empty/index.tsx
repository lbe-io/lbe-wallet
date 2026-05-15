import React from 'react';
import { Empty } from 'antd';
import type { EmptyProps } from 'antd';
import lodingIcon from '@/assets/empty.png';
import './index.css';

const HCEmpty: React.FC<EmptyProps> = (props) => {
  const mergedClassName = ['hc-empty', props.className].filter(Boolean).join(' ');
  return <Empty image={lodingIcon} {...props} className={mergedClassName} />;
};

export default HCEmpty;
