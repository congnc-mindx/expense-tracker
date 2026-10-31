import { useState } from "react";
import SmartSelect from "../common/SmartSelect";
import DatePicker from "../common/DatePicker";
import SuggestInput from "../common/SuggestInput";
import useModalDialog from "../common/useModalDialog";
import { localDate } from "../../utils/finance";
import { formatMoney } from "../../utils/money";
import { parseSocialThousands, toSocialThousands } from "../../utils/socialMoney";
import { OCCASIONS, DIRECTIONS, validateSocialEntry } from "../../utils/social";
import { button, primary, input } from "../finance/ui";

export default function SocialEntryModal({ entry, seed, groups, people, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ personName: "", group: "", direction: "given", occasion: "wedding", amount: "", date: localDate(), note: "", ...seed, ...entry }));
  const [amountText, setAmountText] = useState(() => entry ? toSocialThousands(entry.amount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const modalDialog = useModalDialog(onClose, saving);
  const amount = parseSocialThousands(amountText);
  function change(key, value) { setDraft((old)=>({ ...old, [key]: value })); setError(""); }
  async function submit(event) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError("");
    try {
      if (!Number.isSafeInteger(amount)) throw new Error("Hãy nhập số tiền theo nghìn đồng. VD: 2000 = 2.000.000 đ.");
      await onSave(validateSocialEntry({ ...draft, amount }), entry?.id);
      onClose();
    } catch (e) { setError(e.message || "Không lưu được khoản thăm hỏi."); }
    finally { setSaving(false); }
  }
  const personNames = [...new Set(people.map((p) => p.name))];
  return <dialog ref={modalDialog.ref} onCancel={modalDialog.onCancel}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-visible rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-6">
    <div className="max-h-[calc(90dvh-3rem)] overflow-y-auto overscroll-contain rounded-2xl">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div><h2 className="text-xl font-extrabold">{entry ? "Sửa khoản ghi nhận" : "Ghi nhận mừng & thăm hỏi"}</h2><p className="mt-1 text-sm text-slate-500">Theo dõi từng khoản gửi và nhận</p></div>
      <button type="button" className={button} aria-label="Đóng" disabled={saving} onClick={onClose}>✕</button>
    </div>
    <form className="grid gap-4" onSubmit={submit}>
      <fieldset disabled={saving} className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          {DIRECTIONS.map((item) => <button key={item.id} type="button" aria-pressed={draft.direction===item.id} className={draft.direction===item.id ? primary : button} onClick={() => change("direction", item.id)}>{item.id === "given" ? "↗ " : "↙ "}{item.label}</button>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Tên người / gia đình
            <SuggestInput label="Tên người" value={draft.personName} placeholder="VD: Chí Công" maxLength={100} options={personNames}
              onChange={(name) => change("personName", name)} onChoose={(name) => { const person=people.find((p)=>p.name===name);setDraft((p)=>({...p,personName:name,group:person?.group || p.group})); }}/>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Nhóm quan hệ
            <SuggestInput label="Nhóm quan hệ" maxLength={80} value={draft.group} onChange={(g) => change("group", g)} options={groups} placeholder="VD: Cấp 2, Đồng nghiệp"/>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Dịp / loại khoản
            <SmartSelect label="Dịp / loại khoản" value={draft.occasion} onChange={(v)=>change("occasion",v)} options={OCCASIONS.map((o)=>({value:o.id,label:`${o.icon} ${o.label}`}))}/>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Ngày
            <DatePicker label="Ngày ghi nhận" value={draft.date} onChange={(v)=>change("date",v)} disabled={saving}/>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">Số tiền (nghìn đồng)
          <input className={`${input} py-3 text-2xl font-bold tabular-nums`} inputMode="decimal" required value={amountText} onChange={(e) => { setAmountText(e.target.value.replace(/[^\d.,]/g,"")); setError(""); }} placeholder="VD: 2000" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300" aria-live="polite">{Number.isSafeInteger(amount) ? `Số tiền ghi nhận: ${formatMoney(amount)}` : "Nhập 2000 để ghi nhận 2.000.000 đ"}</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Ghi chú (tùy chọn)
          <textarea className={input} rows={2} maxLength={500} value={draft.note} onChange={(e)=>change("note",e.target.value)} placeholder="Địa điểm, dịp cụ thể, tên vợ/chồng…" />
        </label>
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className={button}>Hủy</button><button type="submit" disabled={saving} className={primary}>{saving ? "Đang lưu…" : "Lưu khoản ghi nhận"}</button></div>
    </form>
    </div>
  </dialog>;
}
