import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Flex } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import './index.css';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title: React.ReactNode;
  leftBtn?: React.ReactNode;
  rightBtn?: React.ReactNode;
  styleHeader?: React.CSSProperties;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, leftBtn, rightBtn, styleHeader = {} }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="full-screen-overlay">
      <div className="full-screen-shell">
        <Flex className="full-screen-header" style={styleHeader} justify="space-between" align="center">
          {leftBtn ? leftBtn : <Button type="text" size="small" shape="circle" icon={<CloseOutlined />} onClick={onClose} />}
          {typeof title === 'string' ? <div className="ui-title-center-lg">{title}</div> : title}
          {rightBtn ? rightBtn : <div className="full-screen-header-placeholder" />}
        </Flex>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

export default Modal;
