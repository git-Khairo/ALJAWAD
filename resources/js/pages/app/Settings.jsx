import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * A pair of mutually exclusive choices, rendered as one ruled control rather
 * than two loose buttons.
 */
const Choice = ({ legend, options, value, onSelect }) => (
  <fieldset>
    <legend className="mb-3 text-sm font-semibold text-foreground">{legend}</legend>
    <div className="inline-flex rounded border border-rule-strong p-0.5">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => !active && onSelect(opt.key)}
            className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors duration-120 ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-fg-muted hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </fieldset>
);

const SettingsPage = () => {
  const { t, language, toggleLanguage, theme, toggleTheme } = useLanguage();
  const { changePassword } = useAuth();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const field = (key) => (e) => {
    const { value } = e.target;
    setPasswords((p) => ({ ...p, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const next = {};
    if (!passwords.current) next.current = l('أدخل كلمة المرور الحالية.', 'Enter your current password.');
    if (passwords.newPass.length < 8) next.newPass = l('8 أحرف على الأقل.', 'Use at least 8 characters.');
    if (passwords.confirm !== passwords.newPass) next.confirm = l('غير متطابقتين.', 'These do not match.');
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await changePassword(passwords.current, passwords.newPass);
      toast.success(l('تم تغيير كلمة المرور.', 'Password changed.'));
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 422 && message?.includes('incorrect')) {
        setErrors({ current: l('كلمة المرور الحالية غير صحيحة.', 'That is not your current password.') });
        return;
      }
      const fallback = message ?? l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.');
      setErrors({ form: fallback });
      toast.error(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('app.settings')}
        description={l('اللغة والمظهر وكلمة المرور.', 'Language, appearance and password.')}
      />

      <div className="max-w-2xl space-y-10">
        <Choice
          legend={t('app.language')}
          value={language}
          onSelect={() => toggleLanguage()}
          options={[
            { key: 'ar', label: 'العربية' },
            { key: 'en', label: 'English' },
          ]}
        />

        <Choice
          legend={t('app.theme')}
          value={theme}
          onSelect={() => toggleTheme()}
          options={[
            { key: 'light', label: l('فاتح', 'Light') },
            { key: 'dark', label: l('داكن', 'Dark') },
          ]}
        />

        <section className="border-t border-rule pt-8">
          <h2 className="mb-5 text-sm font-semibold text-foreground">{t('app.changePassword')}</h2>

          <form onSubmit={handlePasswordChange} noValidate className="max-w-sm space-y-5">
            {errors.form && (
              <p role="alert" className="border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-foreground">
                {errors.form}
              </p>
            )}

            <Field label={t('app.currentPassword')} error={errors.current} required>
              {(props) => (
                <Input {...props} type="password" autoComplete="current-password"
                  value={passwords.current} onChange={field('current')} disabled={loading} />
              )}
            </Field>

            <Field
              label={t('auth.newPassword')}
              hint={l('8 أحرف على الأقل.', 'At least 8 characters.')}
              error={errors.newPass}
              required
            >
              {(props) => (
                <Input {...props} type="password" autoComplete="new-password"
                  value={passwords.newPass} onChange={field('newPass')} disabled={loading} />
              )}
            </Field>

            <Field label={t('auth.confirmPassword')} error={errors.confirm} required>
              {(props) => (
                <Input {...props} type="password" autoComplete="new-password"
                  value={passwords.confirm} onChange={field('confirm')} disabled={loading} />
              )}
            </Field>

            <Button type="submit" variant="accent" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {l('تغيير كلمة المرور', 'Change password')}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
};

export default SettingsPage;
