// src/pages/Onboarding.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Users, BookOpen, School, CheckCircle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import TutorConsentModal from '@/components/onboarding/TutorConsentModal';



const SA_UNIVERSITIES = [
  'University of Cape Town (UCT)',
  'University of the Witwatersrand (Wits)',
  'University of Pretoria (UP)',
  'Stellenbosch University (SU)',
  'University of KwaZulu-Natal (UKZN)',
  'University of Johannesburg (UJ)',
  'University of the Free State (UFS)',
  'University of the Western Cape (UWC)',
  'Rhodes University',
  'North-West University (NWU)',
];

const ROLES = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    color: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
    selectedColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-400',
    desc: 'I am a Grade 10–12 learner looking for study resources and tutor sessions.',
  },
  {
    id: 'parent',
    label: 'Parent / Guardian',
    icon: Users,
    color: 'border-green-200 bg-green-50 hover:bg-green-100',
    selectedColor: 'border-green-500 bg-green-100 ring-2 ring-green-400',
    desc: "I want to monitor my child's academic progress and connect with tutors.",
  },
  {
    id: 'sace_tutor',
    label: 'SACE Registered Tutor',
    icon: Shield,
    color: 'border-primary/20 bg-primary/5 hover:bg-primary/10',
    selectedColor: 'border-primary ring-2 ring-primary bg-primary/10',
    desc: 'I am a qualified, SACE-registered educator who wants to tutor learners.',
  },
  {
    id: 'student_tutor',
    label: 'Student Tutor',
    icon: School,
    color: 'border-purple-200 bg-purple-50 hover:bg-purple-100',
    selectedColor: 'border-purple-500 bg-purple-100 ring-2 ring-purple-400',
    desc: 'I am a university student who wants to tutor Grade 10–12 learners.',
  },
];

export default function Onboarding({ user, onComplete }) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [saceNumber, setSaceNumber] = useState('');
  const [university, setUniversity] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [policyConsent, setPolicyConsent] = useState(false);

  // ✅ Admin redirect (already logged in as admin)
  useEffect(() => {
    const isAdmin = user?.is_super_admin === true;
    if (isAdmin) {
      console.log('🚀 Admin detected in Onboarding – redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // If admin, show loading spinner
  const isAdmin = user?.is_super_admin === true;
  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  const isTutorRole = selectedRole === 'sace_tutor' || selectedRole === 'student_tutor';

  const canSubmit = () => {
    if (!selectedRole) return false;
    if (selectedRole === 'sace_tutor' && !saceNumber.trim()) return false;
    if (selectedRole === 'student_tutor' && (!university || !studentNumber.trim())) return false;
    if (!policyConsent) return false;
    return true;
  };

  const handleSubmitClick = () => {
    if (!canSubmit()) { toast.error('Please complete all required fields.'); return; }
    if (isTutorRole && !consentAccepted) {
      setShowConsent(true);
      return;
    }
    doSubmit(selectedRole);
  };

  const doSubmit = async (role, agreementAccepted = consentAccepted) => {
    const isTutor = role === 'sace_tutor' || role === 'student_tutor';
    setSaving(true);

    try {
      if (!user?.id) throw new Error('Please sign in before completing setup.');
      const { error } = await supabase.rpc('complete_onboarding', {
        requested_role: role,
        sace_number: saceNumber.trim(), university_name: university,
        student_number: studentNumber.trim(), policy_accepted: policyConsent,
        tutor_agreement_accepted: isTutor && agreementAccepted,
      });
      if (error) throw error;

      toast.success(
        isTutor
          ? '✅ Profile submitted! Admin will verify you within 1–2 business days.'
          : '🎉 Welcome to SmartBridge FET!'
      );
      setSaving(false);
      await onComplete?.();
      navigate('/', { replace: true });

    } catch (err) {
      console.error('Onboarding error:', err);
      toast.error(err.message || 'Could not complete setup. Please retry.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-playfair text-3xl font-bold mb-2">Welcome to SmartBridge FET</h1>
          <p className="text-muted-foreground">Tell us who you are so we can personalise your experience.</p>
          {user?.full_name && <p className="text-sm text-primary mt-1 font-medium">Hi, {user.full_name}! 👋</p>}
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {ROLES.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${isSelected ? role.selectedColor : role.color}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{role.label}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Conditional fields */}
        {selectedRole === 'sace_tutor' && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm">SACE Registration Verification</p>
            </div>
            <p className="text-xs text-muted-foreground">Enter your SACE registration number. Our admin team will verify it before activating tutor privileges.</p>
            <div className="space-y-1.5">
              <Label>SACE Registration Number *</Label>
              <Input
                placeholder="e.g. 20012345678"
                value={saceNumber}
                onChange={e => setSaceNumber(e.target.value)}
                className="font-mono"
              />
            </div>
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">
              ⏳ Your profile will be reviewed by an admin before going live
            </Badge>
          </div>
        )}

        {selectedRole === 'student_tutor' && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <School className="w-4 h-4 text-purple-600" />
              <p className="font-semibold text-sm">University Verification</p>
            </div>
            <p className="text-xs text-muted-foreground">Select your university and enter your student number for verification.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>University *</Label>
                <Select value={university} onValueChange={setUniversity}>
                  <SelectTrigger><SelectValue placeholder="Select your university..." /></SelectTrigger>
                  <SelectContent>
                    {SA_UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Student Number *</Label>
                <Input
                  placeholder="e.g. 2023012345"
                  value={studentNumber}
                  onChange={e => setStudentNumber(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">
              ⏳ Your student tutor profile will be reviewed by an admin
            </Badge>
          </div>
        )}

        {selectedRole === 'parent' && <p className="text-sm mb-5">Linking a learner requires verified permission. Contact support to arrange access.</p>}

        {/* Consent & Policy */}
        {isTutorRole && !consentAccepted && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-xs text-amber-800">
            <p className="font-semibold mb-0.5">⚖️ Service Agreement Required</p>
            <p>You'll need to review and accept the Independent Tutor Service Agreement before completing registration.</p>
          </div>
        )}
        {isTutorRole && consentAccepted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-xs text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Service Agreement accepted. You may now complete your registration.</span>
          </div>
        )}

        <div className="flex items-start gap-3 mb-5 p-4 bg-card border border-border rounded-xl">
          <Checkbox
            id="policyConsent"
            checked={policyConsent}
            onCheckedChange={checked => setPolicyConsent(checked === true)}
            className="mt-1 flex-shrink-0"
          />
          <Label htmlFor="policyConsent" className="text-xs text-foreground cursor-pointer leading-relaxed">
            I have read and agree to the{' '}
            <Link to="/privacy" target="_blank" className="text-primary font-semibold hover:underline">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link to="/terms" target="_blank" className="text-primary font-semibold hover:underline">
              Terms of Service
            </Link>.
          </Label>
        </div>

        <Button
          onClick={handleSubmitClick}
          disabled={!canSubmit() || saving}
          className="w-full bg-primary gap-2 text-base py-5 rounded-xl"
          size="lg"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {saving ? 'Setting up your account...' : isTutorRole && !consentAccepted ? 'Review Agreement & Register' : 'Complete Setup'}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">You can update your profile details anytime from your dashboard.</p>
      </div>

      {/* Consent Modal */}
      <TutorConsentModal
        open={showConsent}
        user={user}
        onAccept={() => {
          setConsentAccepted(true);
          setShowConsent(false);
          doSubmit(selectedRole, true);
        }}
        onDecline={() => setShowConsent(false)}
      />
    </div>
  );
}
