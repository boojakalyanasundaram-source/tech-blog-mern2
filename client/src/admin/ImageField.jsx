import { useRef, useState } from 'react';
import { api } from '../api';
import { thumbOf } from '../utils';
import { useToast } from './Toast.jsx';

export default function ImageField({ value, onChange, label = 'Image' }) {
  const ref = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="image-field">
      {value ? <img src={thumbOf(value)} alt={`${label} preview`} /> : <div className="image-field__empty">No image selected</div>}
      <div className="image-field__actions">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </button>
        {value && <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange('')}>Remove</button>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden onChange={pick} />
    </div>
  );
}
