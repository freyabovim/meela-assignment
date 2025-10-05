import type { Component } from 'solid-js';
import { createSignal, Show, onMount } from 'solid-js';
import './App.css';

const App: Component = () => {
  const [currentStep, setCurrentStep] = createSignal(1);
  const [formData, setFormData] = createSignal({
    email: '',
    therapyForWhom: '',
    therapistGender: '',
  });
  const [userId, setUserId] = createSignal(getUserIdFromUrl());

  function getUserIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('userId');
  }

  function updateUrlWithUserId(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('userId', id);
    window.history.pushState({}, '', url.toString());
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = async () => {
    if (currentStep() === 1 && !userId()) {
      const response = await fetch('/api/save-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: null,
          form_step: 1,
          email: formData().email,
          therapy_for_whom: formData().therapyForWhom,
          therapist_gender: formData().therapistGender,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user_id);
        updateUrlWithUserId(data.user_id);
      }
    } else if (userId()) {
      await saveFormData();
    }
    
    setCurrentStep(Math.min(currentStep() + 1, 3));
  };

  const prevStep = async () => {
    if (userId()) {
      await saveFormData();
    }
    setCurrentStep(Math.max(currentStep() - 1, 1));
  };

  const saveFormData = async () => {
    if (!userId()) return;
    
    await fetch('/api/save-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId(),
        form_step: currentStep(),
        email: formData().email,
        therapy_for_whom: formData().therapyForWhom,
        therapist_gender: formData().therapistGender,
      }),
    });
  };

  const loadFormData = async () => {
    if (!userId()) return;
    
    const response = await fetch('/api/load-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId() }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.email || data.therapy_for_whom || data.therapist_gender) {
        setFormData({
          email: data.email || '',
          therapyForWhom: data.therapy_for_whom || '',
          therapistGender: data.therapist_gender || '',
        });
        setCurrentStep(data.form_step || 1);
      }
    }
  };

  onMount(() => {
    if (userId()) {
      loadFormData();
    }
  });

  return (
    <div>
      <h1>Meela Client Intake Form</h1>
      
      <Show when={currentStep() === 1}>
        <div>
          <h2>Step 1 of 3</h2>
          <input
            type="email"
            value={formData().email}
            onInput={(e) => updateFormData('email', e.target.value)}
            placeholder="Email"
          />
        </div>
      </Show>

      <Show when={currentStep() === 2}>
        <div>
          <h2>Step 2 of 3</h2>
          <select 
            value={formData().therapyForWhom}
            onChange={(e) => updateFormData('therapyForWhom', e.target.value)}
          >
            <option value="">Who is this therapy for?</option>
            <option value="individual">Just me</option>
            <option value="couple">Me and my partner</option>
            <option value="family">My family</option>
          </select>
        </div>
      </Show>

      <Show when={currentStep() === 3}>
        <div>
          <h2>Step 3 of 3</h2>
          <select 
            value={formData().therapistGender}
            onChange={(e) => updateFormData('therapistGender', e.target.value)}
          >
            <option value="">Therapist preference</option>
            <option value="male">Man</option>
            <option value="female">Woman</option>
            <option value="non-binary">Non-binary</option>
            <option value="no-preference">No Preference</option>
          </select>
        </div>
      </Show>

      <div>
        <button onClick={prevStep} disabled={currentStep() === 1}>
          Previous
        </button>
        <button onClick={nextStep} disabled={currentStep() === 3}>
          Next
        </button>
      </div>
    </div>
  );
};

export default App;