"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

type CustomerStatus = "lead" | "qualified" | "active" | "closed";

interface Customer {
  id: string;
  name: string;
  company: string | null;
  email: string;
  country: string | null;
  sector: string | null;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerDraft {
  name: string;
  company: string;
  email: string;
  country: string;
  sector: string;
  status: CustomerStatus;
  notes: string;
}

const emptyDraft: CustomerDraft = {
  name: "",
  company: "",
  email: "",
  country: "",
  sector: "",
  status: "lead",
  notes: "",
};

const statuses: { value: CustomerStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

function displayDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft);

  async function loadCustomers() {
    const { data, error: queryError } = await createSupabaseBrowserClient()
      .from("customer_records")
      .select("*")
      .order("updated_at", { ascending: false });
    if (queryError) {
      setError(`Customer records could not be loaded: ${queryError.message}`);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadCustomers(), 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.company, customer.email, customer.country, customer.sector]
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [customers, search]);

  function startNewCustomer() {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function startEditing(customer: Customer) {
    setEditingId(customer.id);
    setDraft({
      name: customer.name,
      company: customer.company ?? "",
      email: customer.email,
      country: customer.country ?? "",
      sector: customer.sector ?? "",
      status: customer.status,
      notes: customer.notes ?? "",
    });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const record = {
      name: draft.name.trim(),
      company: draft.company.trim() || null,
      email: draft.email.trim(),
      country: draft.country.trim() || null,
      sector: draft.sector.trim() || null,
      status: draft.status,
      notes: draft.notes.trim() || null,
    };
    const result = editingId
      ? await supabase.from("customer_records").update(record).eq("id", editingId)
      : await supabase.from("customer_records").insert(record);
    if (result.error) {
      setError(`Customer could not be saved: ${result.error.message}`);
    } else {
      setNotice(editingId ? "Customer details updated." : "Customer added.");
      setShowForm(false);
      setEditingId(null);
      setDraft(emptyDraft);
      await loadCustomers();
    }
    setWorking(false);
  }

  async function deleteCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.name}'s customer record? This cannot be undone.`)) return;
    setWorking(true);
    setError("");
    setNotice("");
    const { error: deleteError } = await createSupabaseBrowserClient()
      .from("customer_records")
      .delete()
      .eq("id", customer.id);
    if (deleteError) {
      setError(`Customer could not be deleted: ${deleteError.message}`);
    } else {
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      setNotice("Customer record deleted.");
    }
    setWorking(false);
  }

  return (
    <section className="customer-workspace" aria-labelledby="customer-list-title">
      <div className="customer-toolbar">
        <div className="customer-count">
          <span className="landing-kicker">CUSTOMER DIRECTORY</span>
          <h2 id="customer-list-title">{customers.length} <span>records</span></h2>
        </div>
        <div className="customer-tools">
          <label className="customer-search">
            <span className="visually-hidden">Search customers</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, email…" />
          </label>
          <button className="gold-button" type="button" onClick={startNewCustomer}>Add customer <span aria-hidden="true">+</span></button>
        </div>
      </div>

      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {showForm && (
        <form className="customer-edit-form" onSubmit={(event) => void saveCustomer(event)}>
          <div className="customer-form-heading">
            <div>
              <p className="landing-kicker">{editingId ? "EDIT RECORD" : "NEW RECORD"}</p>
              <h3>{editingId ? "Update customer details" : "Add a customer"}</h3>
            </div>
            <button className="customer-cancel" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className="customer-form-grid">
            <label>Full name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={120} autoComplete="name" required /></label>
            <label>Company<input value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} maxLength={160} autoComplete="organization" /></label>
            <label>Email<input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} maxLength={254} autoComplete="email" required /></label>
            <label>Country<input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} maxLength={80} autoComplete="country-name" /></label>
            <label>Business sector<input value={draft.sector} onChange={(event) => setDraft({ ...draft, sector: event.target.value })} maxLength={100} placeholder="e.g. Commodities" /></label>
            <label>Relationship status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CustomerStatus })}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label className="customer-notes-field">Staff notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={4000} rows={4} /></label>
          </div>
          <div className="customer-form-actions">
            <span>Keep customer data limited to information needed for your business.</span>
            <button className="gold-button" type="submit" disabled={working}>{working ? "Saving…" : editingId ? "Save changes" : "Add customer"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="customer-empty">Loading customer records…</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="customer-empty">
          <span className="empty-record-icon" aria-hidden="true">◎</span>
          <strong>{customers.length ? "No matching customers" : "No customer records yet"}</strong>
          <p>{customers.length ? "Try another search term." : "Add a customer to start building your private directory."}</p>
        </div>
      ) : (
        <div className="customer-list">
          {filteredCustomers.map((customer) => (
            <article className="customer-card" key={customer.id}>
              <div className="customer-card-main">
                <div className="customer-avatar" aria-hidden="true">{customer.name.slice(0, 1).toUpperCase()}</div>
                <div className="customer-identity">
                  <h3>{customer.name}</h3>
                  <p>{customer.company || "Independent customer"}{customer.country ? ` · ${customer.country}` : ""}</p>
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </div>
                <span className={`customer-status status-${customer.status}`}>{customer.status}</span>
              </div>
              <div className="customer-card-meta">
                <span>{customer.sector || "Sector not set"}</span>
                <span>Updated {displayDate(customer.updated_at)}</span>
              </div>
              {customer.notes && <p className="customer-notes">{customer.notes}</p>}
              <div className="customer-card-actions">
                <button type="button" className="customer-action" onClick={() => startEditing(customer)}>Edit record</button>
                <button type="button" className="customer-action customer-delete" onClick={() => void deleteCustomer(customer)} disabled={working}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="customer-privacy-note">Customer details are stored in Supabase and protected by staff-only row-level security. Do not enter payment card details, passwords, or sensitive identity documents.</p>
    </section>
  );
}
