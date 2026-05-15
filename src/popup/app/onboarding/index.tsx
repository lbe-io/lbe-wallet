import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import WelcomeIcon from '@/assets/icon/WelcomeIcon.svg';
import { useWallet } from '@/app/contexts';
import { useAppDispatch } from '@/popup/hooks/redux';
import { updateWallet, updateAccount, updateChain } from '@/popup/store/features/applicationSlice';
import { resetWalletEnvironment } from '@/popup/utils/walletSetup';
import { AppIcon } from '@/assets/icon';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const wallet = useWallet();
  const dispatch = useAppDispatch();

  const [termsOpen, setTermsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [openingWelcome, setOpeningWelcome] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement | null>(null);

  const termsParagraphs = useMemo(
    () => [
      t('page.onboarding.terms.paragraph.1'),
      t('page.onboarding.terms.paragraph.2'),
      t('page.onboarding.terms.paragraph.3'),
      t('page.onboarding.terms.paragraph.4'),
      t('page.onboarding.terms.paragraph.5'),
      t('page.onboarding.terms.paragraph.6'),
      t('page.onboarding.terms.paragraph.7'),
      t('page.onboarding.terms.paragraph.8'),
      t('page.onboarding.terms.paragraph.9'),
      t('page.onboarding.terms.paragraph.10'),
      t('page.onboarding.terms.paragraph.11'),
    ],
    [t, i18n.resolvedLanguage],
  );

  const handleOpenTerms = () => {
    setAgreed(false);
    setReachedBottom(false);
    setTermsOpen(true);
  };

  const resetWalletData = useCallback(async () => {
    await resetWalletEnvironment(wallet);
    dispatch(updateWallet({ wallet: {} }));
    dispatch(updateAccount({ account: {} }));
    dispatch(updateChain({ chain: {} }));
  }, [wallet, dispatch]);

  useEffect(() => {
    if (!termsOpen) return;

    setReachedBottom(false);

    const node = termsBodyRef.current;
    if (!node) return;

    setTimeout(() => {
      node.scrollTop = 0;
    }, 50);
  }, [termsOpen]);

  const handleTermsScroll = () => {
    const node = termsBodyRef.current;
    if (!node || reachedBottom) return;

    if (node.scrollHeight - node.scrollTop - node.clientHeight <= 2) {
      setReachedBottom(true);
    }
  };

  const handleAgree = async () => {
    if (!agreed || !reachedBottom || openingWelcome) return;

    try {
      setOpeningWelcome(true);
      await resetWalletData();
      setTermsOpen(false);
      navigate('/welcome');
    } finally {
      setOpeningWelcome(false);
    }
  };

  const scrollToBottom = () => {
    const node = termsBodyRef.current;
    if (!node) return;

    node.scrollTo({
      top: node.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="onboarding-page">
      <main className="onboarding-page-main">
        <section className="onboarding-page-content">
          <h1>{t('page.onboarding.title')}</h1>
          <Button type="primary" shape="round" size="large" className="onboarding-page-button" onClick={handleOpenTerms}>
            {t('page.onboarding.get.started')}
            <ArrowRightOutlined />
          </Button>
        </section>

        <section className="onboarding-page-visual">
          <img src={WelcomeIcon} alt="Onboarding illustration" />
        </section>
      </main>

      <footer className="onboarding-page-footer">{t('page.onboarding.footer')}</footer>

      <Modal open={termsOpen} onCancel={() => setTermsOpen(false)} footer={null} width={480} centered rootClassName="terms-modal-root" closable={false} maskClosable>
        <div className="terms-modal">
          <div className="terms-modal-header">
            <span>{t('page.onboarding.terms.title')}</span>
            <button type="button" className="terms-modal-close" onClick={() => setTermsOpen(false)} aria-label={t('common.close')}>
              <CloseOutlined />
            </button>
          </div>

          <div className="terms-modal-body-wrapper">
            <div ref={termsBodyRef} onScroll={handleTermsScroll} className="terms-modal-body">
              {termsParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <Button size="small" icon={<AppIcon name="BottomIcon" />} onClick={scrollToBottom} className="terms-modal-scroll-btn" />
          </div>

          <Flex vertical gap={16} className="terms-modal-actions">
            <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
              {t('page.onboarding.terms.agree')}
            </Checkbox>
            <Button type="primary" shape="round" size="large" block loading={openingWelcome} disabled={!agreed || !reachedBottom || openingWelcome} onClick={handleAgree}>
              {t('page.onboarding.terms.continue')}
            </Button>
          </Flex>
        </div>
      </Modal>
    </div>
  );
}
