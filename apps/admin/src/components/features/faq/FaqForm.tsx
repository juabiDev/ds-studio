"use client";

import { useState, type FormEvent } from "react";

import type { FaqItemInput } from "@/app/actions/faq";

import { fieldClass, hintClass, labelClass, submitClass, textareaClass } from "@/lib/form-styles";
import type { ActionResult } from "@/types/admin";

interface FaqFormProps {
  idPrefix: string;
  initial?: FaqItemInput;
  submitLabel: string;
  onSubmit: (input: FaqItemInput) => Promise<ActionResult>;
  onSaved?: () => void;
  resetOnSave?: boolean;
}

export const FaqForm = ({ idPrefix, initial, submitLabel, onSubmit, onSaved, resetOnSave }: FaqFormProps) => {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await onSubmit({ question, answer });
    setSaving(false);

    if (!result.ok) return setError(result.error);
    if (resetOnSave) {
      setQuestion("");
      setAnswer("");
    }
    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${idPrefix}-question`} className={labelClass}>Pregunta</label>
        <input
          id={`${idPrefix}-question`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          maxLength={160}
          placeholder="¿Tienen estacionamiento?"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-answer`} className={labelClass}>Respuesta</label>
        <textarea
          id={`${idPrefix}-answer`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          maxLength={1500}
          rows={4}
          className={textareaClass}
        />
        <p className={hintClass}>Los saltos de línea se respetan en el sitio.</p>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={saving} className={submitClass}>
        {saving ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
};
