import React, { useState } from 'react';
import type { FieldDef } from '../../../types';
import { cn } from '../../../utils/cn';
import { Plus, Trash2 } from 'lucide-react';

// ─── Key–Value Field ───────────────────────────────────────────────────────────

interface KVEntry { key: string; value: string }

const KVField: React.FC<{
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}> = ({ value, onChange }) => {
  const entries: KVEntry[] = Object.entries(value).map(([k, v]) => ({ key: k, value: v }));

  const update = (idx: number, field: 'key' | 'value', val: string) => {
    const next = [...entries];
    next[idx] = { ...next[idx], [field]: val };
    onChange(Object.fromEntries(next.map((e) => [e.key, e.value])));
  };

  const add    = () => onChange({ ...value, '': '' });
  const remove = (idx: number) => {
    const next = entries.filter((_, i) => i !== idx);
    onChange(Object.fromEntries(next.map((e) => [e.key, e.value])));
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            aria-label={`Parameter key ${idx + 1}`}
            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="key"
            value={entry.key}
            onChange={(e) => update(idx, 'key', e.target.value)}
          />
          <input
            aria-label={`Parameter value ${idx + 1}`}
            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="value"
            value={entry.value}
            onChange={(e) => update(idx, 'value', e.target.value)}
          />
          <button
            onClick={() => remove(idx)}
            title="Remove parameter"
            aria-label="Remove parameter"
            className="text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        <Plus size={12} /> Add parameter
      </button>
    </div>
  );
};

// ─── Dynamic Form Engine ───────────────────────────────────────────────────────

interface DynamicFormProps {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const inputCls = cn(
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50',
  'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium'
);

export const DynamicForm: React.FC<DynamicFormProps> = ({ fields, values, onChange }) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {field.label}
            {field.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              className={inputCls}
              placeholder={field.placeholder}
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              aria-label={field.label}
              className={inputCls}
              placeholder={field.placeholder}
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              aria-label={field.label}
              className={inputCls}
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              aria-label={field.label}
              className={cn(inputCls, 'h-20 resize-none')}
              placeholder={field.placeholder}
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}

          {field.type === 'select' && (
            <select
              id={`field-${field.key}`}
              aria-label={field.label}
              className={inputCls}
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              <option value="">Select…</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {field.type === 'kv' && (
            <KVField
              value={(values[field.key] as Record<string, string>) ?? {}}
              onChange={(v) => onChange(field.key, v)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
