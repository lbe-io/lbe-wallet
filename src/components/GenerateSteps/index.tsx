import React from 'react';
import { Flex, Button } from 'antd';
import { AppIcon } from '@/assets/icon';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

interface GenerateStepsProps {
  steps: number;
  curStep: number;
  title: string | React.ReactNode;
  tip?: React.ReactNode;
  onBack?: () => void;
  onTipClick?: () => void;
  children?: React.ReactNode;
  tipSlot?: React.ReactNode;
}

const GenerateSteps: React.FC<GenerateStepsProps> = ({ steps, curStep, title, tip, onBack, onTipClick, children, tipSlot }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasTipListener = !!onTipClick;
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <Flex vertical align="center" className="generate-steps onboarding-border-radius">
      <Flex className="generate-steps-header" align="center">
        <AppIcon name="LeftIcon" className="generate-steps-back-icon" onClick={handleBack} />
        {typeof title === 'string' ? <div className="ui-title-center-lg">{title}</div> : title}
        <div className="generate-steps-header-placeholder" />
      </Flex>

      <Flex className="generate-steps-progress" justify="center" gap={16}>
        {Array.from({ length: steps }, (_, i) => {
          const step = i + 1;
          return (
            <Button key={step} block size="middle" color="default" className="generate-steps-progress-btn" variant={step <= curStep ? 'outlined' : 'filled'}>
              {t('common.step')} {step}
            </Button>
          );
        })}
      </Flex>

      {(tip || tipSlot) && (
        <Flex className="generate-steps-tip ui-text-md-secondary-tight" justify="center" gap={8}>
          {tip ?? tipSlot}

          {hasTipListener && <AppIcon name="TitleTooltipIcon" onClick={onTipClick} />}
        </Flex>
      )}

      {children}
    </Flex>
  );
};

export default GenerateSteps;
