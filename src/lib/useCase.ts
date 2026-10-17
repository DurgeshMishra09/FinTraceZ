import { useCallback, useState } from 'react';
import { analyse, MAX_BYTES, MAX_ROWS, parseCSV, SAMPLE_CSV } from './analyze';
import type { Analysis, Tx } from './analyze';

export function useCase() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [filename, setFilename] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const load = useCallback(async (file?: File): Promise<boolean> => {
    try {
      setError('');
      if (file && file.size > MAX_BYTES) throw new Error('This file is larger than 5 MB. Please upload a smaller CSV.');
      const text = file ? await file.text() : SAMPLE_CSV;
      const r = parseCSV(text);
      const notes: string[] = [];
      if (r.skipped) notes.push(`${r.skipped} row(s) skipped (missing account, self-transfer or invalid amount).`);
      if (r.truncated) notes.push(`Only the first ${MAX_ROWS.toLocaleString('en-IN')} rows were read.`);
      if (!r.txs.some((t) => t.ts !== null)) notes.push('No usable timestamps found, so speed-based checks are switched off.');
      setTxs(r.txs);
      setFilename(file ? file.name : 'sample_transactions.csv');
      setIsSample(!file);
      setNote(notes.join(' '));
      setAnalysis(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
      return false;
    }
  }, []);

  const run = useCallback(() => { if (txs.length) setAnalysis(analyse(txs)); }, [txs]);
  const reset = useCallback(() => { setTxs([]); setAnalysis(null); setFilename(''); setNote(''); setError(''); setIsSample(false); }, []);

  return { txs, filename, isSample, note, error, analysis, load, run, reset, setError };
}
export type CaseApi = ReturnType<typeof useCase>;