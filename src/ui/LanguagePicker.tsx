import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {setLocale, t, useI18n, type Locale} from './i18n';

export function LanguagePickerPortal() {
  const {locale} = useI18n();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findHost = () => {
      const candidate = document.querySelector<HTMLElement>('.header-right');
      if (candidate) setHost(candidate);
    };
    findHost();
    const observer = new MutationObserver(findHost);
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, []);

  if (!host) return null;
  return createPortal(
    <label className="language-control">
      <span className="visually-hidden">{t('語言')}</span>
      <select aria-label={t('語言')} value={locale} onChange={event => setLocale(event.target.value as Locale)}>
        <option value="zh-TW">{t("繁體中文")}</option>
        <option value="en">{t("English")}</option>
      </select>
    </label>,
    host
  );
}
