import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignupMutation } from '@/store/services/authApi';
import { getFcmToken } from '@/services/pushNotifications';
import { getErrorMessage } from '@/lib/error-message';
import {
  confirmMpinError,
  companyNameError,
  cityError,
  emailError,
  mapApiErrorToSignupField,
  mpinError,
  nameError,
  passwordError,
  phoneError,
  securityAnswerError,
  securityQuestionError,
} from '@/lib/form-validation';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import SecurityQuestionDropdown from '@/components/SecurityQuestionDropdown';

const digitsOnly = (value: string, max = 6) => value.replace(/\D/g, '').slice(0, max);

type FieldKey =
  | 'name'
  | 'companyName'
  | 'city'
  | 'email'
  | 'phone'
  | 'password'
  | 'mpin'
  | 'confirmMpin'
  | 'securityQuestion'
  | 'securityAnswer';

export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [signup, { isLoading }] = useSignupMutation();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const values = {
    name, companyName, city, email, phone, password, mpin, confirmMpin, securityQuestion, securityAnswer,
  };
  const latest = useRef(values);
  latest.current = values;

  const setFieldError = (key: FieldKey, message: string) => {
    setErrors((prev) => {
      if (!message) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: message };
    });
  };

  const validateKey = (key: FieldKey, overrides?: Partial<typeof values>) => {
    const current = { ...latest.current, ...overrides };
    if (key === 'name') return nameError(current.name);
    if (key === 'companyName') return companyNameError(current.companyName);
    if (key === 'city') return cityError(current.city);
    if (key === 'email') return emailError(current.email);
    if (key === 'phone') return phoneError(current.phone);
    if (key === 'password') return passwordError(current.password);
    if (key === 'mpin') return mpinError(current.mpin);
    if (key === 'confirmMpin') return confirmMpinError(current.confirmMpin, current.mpin);
    if (key === 'securityQuestion') return securityQuestionError(current.securityQuestion);
    return securityAnswerError(current.securityAnswer);
  };

  const onBlurField = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldError(key, validateKey(key));
  };

  const updateField = (key: FieldKey, value: string) => {
    const setters: Record<FieldKey, (v: string) => void> = {
      name: setName,
      companyName: setCompanyName,
      city: setCity,
      email: setEmail,
      phone: setPhone,
      password: setPassword,
      mpin: setMpin,
      confirmMpin: setConfirmMpin,
      securityQuestion: setSecurityQuestion,
      securityAnswer: setSecurityAnswer,
    };
    setters[key](value);
    latest.current = { ...latest.current, [key]: value };
    setApiError('');
    if (touched[key]) setFieldError(key, validateKey(key, { [key]: value }));
    if (key === 'mpin' && touched.confirmMpin) {
      setFieldError('confirmMpin', confirmMpinError(confirmMpin, value));
    }
  };

  const fieldKeys: FieldKey[] = [
    'name', 'companyName', 'city', 'email', 'phone', 'password', 'mpin', 'confirmMpin', 'securityQuestion', 'securityAnswer',
  ];

  const validateAll = () => {
    const next: Record<string, string> = {};
    fieldKeys.forEach((key) => {
      const msg = validateKey(key);
      if (msg) next[key] = msg;
    });
    setTouched({
      name: true, companyName: true, city: true, email: true, phone: true, password: true,
      mpin: true, confirmMpin: true, securityQuestion: true, securityAnswer: true,
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSignup = async () => {
    setApiError('');
    if (!validateAll()) return;
    try {
      // Save device token at signup — pending users cannot log in until approved
      const fcmToken = await getFcmToken();
      await signup({
        name,
        companyName,
        city,
        email,
        phone,
        password,
        mpin,
        confirmMpin,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
        ...(fcmToken ? { fcmToken } : {}),
      }).unwrap();
      Alert.alert(
        'Account created',
        'Your account is awaiting admin approval. After approval, sign in with your 6-digit MPIN.',
        [{ text: 'OK', onPress: () => navigation.navigate('MpinLogin') }],
      );
    } catch (e) {
      const message = getErrorMessage(e, 'Signup failed. Please try again.');
      const mapped = mapApiErrorToSignupField(message);
      if (mapped.field) {
        setTouched((prev) => ({ ...prev, [mapped.field!]: true }));
        setFieldError(mapped.field as FieldKey, mapped.text);
      }
      setApiError(mapped.text || message);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={s.logoBox}><Text style={s.logoText}>GM</Text></View>
        <View style={s.headerCopy}>
          <Text style={s.brand}>GM SILVER</Text>
          <Text style={s.heading}>Create Account</Text>
        </View>
      </View>

      {!!apiError && (
        <View style={s.apiBanner}>
          <Text style={s.apiBannerText}>{apiError}</Text>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.subheading}>Fill the details below. You can log in with email or mobile.</Text>

          <Field label="Full Name" error={errors.name}>
            <TextInput
              style={[s.input, (errors.name ? s.inputError : undefined)]}
              placeholder="Your full name"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={(v) => updateField('name', v)}
              onBlur={() => onBlurField('name')}
              autoCapitalize="words"
              selectionColor={C.gold}
            />
          </Field>

          <Field label="Company Name" error={errors.companyName}>
            <TextInput
              style={[s.input, (errors.companyName ? s.inputError : undefined)]}
              placeholder="Your company name"
              placeholderTextColor={C.textMuted}
              value={companyName}
              onChangeText={(v) => updateField('companyName', v)}
              onBlur={() => onBlurField('companyName')}
              autoCapitalize="words"
              selectionColor={C.gold}
            />
          </Field>

          <Field label="City / Destination" error={errors.city}>
            <TextInput
              style={[s.input, (errors.city ? s.inputError : undefined)]}
              placeholder="City or destination"
              placeholderTextColor={C.textMuted}
              value={city}
              onChangeText={(v) => updateField('city', v)}
              onBlur={() => onBlurField('city')}
              autoCapitalize="words"
              selectionColor={C.gold}
            />
          </Field>

          <Field label="Email Address" error={errors.email}>
            <TextInput
              style={[s.input, (errors.email ? s.inputError : undefined)]}
              placeholder="you@example.com"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={(v) => updateField('email', v)}
              onBlur={() => onBlurField('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              selectionColor={C.gold}
            />
          </Field>

          <Field label="Mobile Number" error={errors.phone} hint="You can log in with email or this mobile number">
            <TextInput
              style={[s.input, (errors.phone ? s.inputError : undefined)]}
              placeholder="9876543210"
              placeholderTextColor={C.textMuted}
              value={phone}
              onChangeText={(v) => updateField('phone', v)}
              onBlur={() => onBlurField('phone')}
              keyboardType="phone-pad"
              selectionColor={C.gold}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password}
            hint="Min 8 characters with 1 capital, 1 number and 1 special character"
          >
            <View style={s.pwWrap}>
              <TextInput
                style={[s.input, s.pwInput, (errors.password ? s.inputError : undefined)]}
                placeholder="Create a password"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={(v) => updateField('password', v)}
                onBlur={() => onBlurField('password')}
                secureTextEntry={!showPw}
                selectionColor={C.gold}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="6-Digit MPIN" error={errors.mpin} hint="Exactly 6 numbers. Used for daily login">
            <TextInput
              style={[s.input, (errors.mpin ? s.inputError : undefined)]}
              placeholder="* * * * * *"
              placeholderTextColor={C.textMuted}
              value={mpin}
              onChangeText={(v) => updateField('mpin', digitsOnly(v))}
              onBlur={() => onBlurField('mpin')}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              selectionColor={C.gold}
            />
          </Field>

          <Field label="Confirm MPIN" error={errors.confirmMpin}>
            <TextInput
              style={[s.input, (errors.confirmMpin ? s.inputError : undefined)]}
              placeholder="* * * * * *"
              placeholderTextColor={C.textMuted}
              value={confirmMpin}
              onChangeText={(v) => updateField('confirmMpin', digitsOnly(v))}
              onBlur={() => onBlurField('confirmMpin')}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              selectionColor={C.gold}
            />
          </Field>

          <Field label="Security Question" error={errors.securityQuestion}>
            <SecurityQuestionDropdown
              value={securityQuestion}
              hasError={!!errors.securityQuestion}
              onChange={(key) => {
                setSecurityQuestion(key);
                setTouched((prev) => ({ ...prev, securityQuestion: true }));
                setFieldError('securityQuestion', securityQuestionError(key));
                setApiError('');
              }}
            />
          </Field>

          <Field label="Security Answer" error={errors.securityAnswer} hint="Used to reset MPIN and password if you forget both">
            <TextInput
              style={[s.input, (errors.securityAnswer ? s.inputError : undefined)]}
              placeholder="Your answer"
              placeholderTextColor={C.textMuted}
              value={securityAnswer}
              onChangeText={(v) => updateField('securityAnswer', v)}
              onBlur={() => onBlurField('securityAnswer')}
              autoCapitalize="none"
              selectionColor={C.gold}
            />
          </Field>
        </View>
      </ScrollView>

      <View style={[s.footerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSignup} disabled={isLoading} activeOpacity={0.85}>
          {isLoading
            ? <ActivityIndicator color={C.bg} size="small" />
            : <Text style={s.btnPrimaryText}>Create Account</Text>}
        </TouchableOpacity>
        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MpinLogin')}>
            <Text style={s.footerLink}>Sign In with MPIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? (
        <Text style={s.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : (
        <View style={s.fieldSpacer} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
    gap: 12,
  },
  logoBox: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: C.primary,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  headerCopy: { flex: 1 },
  brand: { color: C.primaryDim, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  heading: { color: C.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  apiBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: 'rgba(196,92,92,0.1)',
    borderWidth: 1,
    borderColor: C.error,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  apiBannerText: { color: C.error, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  subheading: { color: C.textSub, fontSize: 13, lineHeight: 18, marginBottom: 18 },
  field: { marginBottom: 4 },
  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
  },
  inputError: { borderColor: C.error },
  errorText: { color: C.error, fontSize: 12, lineHeight: 16, marginTop: 6, marginBottom: 10 },
  hint: { color: C.textMuted, fontSize: 11, lineHeight: 15, marginTop: 6, marginBottom: 10 },
  fieldSpacer: { height: 12 },
  pwWrap: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { flex: 1, marginRight: 8 },
  eyeBtn: { paddingHorizontal: 8, paddingVertical: 10 },
  eyeText: { color: C.goldDim, fontSize: 13, fontWeight: '700' },
  footerBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  btn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.primary },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.text, fontSize: 13, fontWeight: '700' },
});
