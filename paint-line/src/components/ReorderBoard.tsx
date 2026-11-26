import { useState, useSyncExternalStore } from "react";
import { SHIFTS, type ShiftId } from "../model";
import {
  decideRequest,
  formatDay,
  formatWhen,
  loadBoard,
  requestReorder,
  saveBoard,
  shiftLabel,
  subscribeBoard,
  type ReorderItem,
} from "../reorder";
import { SignaturePad } from "./SignaturePad";

function cardTone(item: ReorderItem): "idle" | "requested" | "rejected" | "confirmed" {
  if (item.request?.status === "requested") return "requested";
  if (item.request?.status === "rejected") return "rejected";
  if (item.request?.status === "confirmed") return "confirmed";
  return "idle";
}

export function ReorderBoard({ onOpenReview }: { onOpenReview: () => void }) {
  const board = useSyncExternalStore(subscribeBoard, loadBoard, loadBoard);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <main className="overview reorder-page">
      <p className="overview-lead">
        Liste commune à tous les quarts. Choisissez un article gris, puis
        envoyez une demande.
        <br />
        Shared by every shift. Choose a grey item, then send a request.
      </p>
      <div className="reorder-toolbar">
        <button type="button" className="ghost-btn reorder-mail" onClick={onOpenReview}>
          Ouvrir la revue courriel / Open the email review
        </button>
      </div>
      <div className="reorder-list">
        {board.items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => {
              if (item.request?.status === "requested") return;
              setOpenId((current) => (current === item.id ? null : item.id));
            }}
            onSent={() => setOpenId(null)}
          />
        ))}
      </div>
    </main>
  );
}

function ItemCard({
  item,
  open,
  onToggle,
  onSent,
}: {
  item: ReorderItem;
  open: boolean;
  onToggle: () => void;
  onSent: () => void;
}) {
  const tone = cardTone(item);
  return (
    <article className={`reorder-card tone-${tone}`}>
      <button type="button" className="reorder-card-main" onClick={onToggle}>
        <header>
          <h2>{item.name}</h2>
          <span>N° {item.sku}</span>
        </header>
        <dl>
          <div>
            <dt>Dernière commande / Last order</dt>
            <dd>{formatWhen(item.lastOrderDate)}</dd>
          </div>
          <div>
            <dt>Commande passée par / Order placed by</dt>
            <dd>{item.request?.placedBy || item.lastOrderedBy || "—"}</dd>
          </div>
          <div>
            <dt>Livraison prévue / Expected delivery</dt>
            <dd>{formatDay(item.request?.expectedDelivery || "")}</dd>
          </div>
          <div>
            <dt>Livraison confirmée par / Delivery confirmed by</dt>
            <dd>{item.deliveredBy || "—"}</dd>
          </div>
          <div>
            <dt>Date de confirmation / Confirmation date</dt>
            <dd>{formatWhen(item.deliveredAt)}</dd>
          </div>
        </dl>
        {item.request?.status === "requested" ? (
          <p className="reorder-flag">En demande / On Request</p>
        ) : null}
        {item.request?.status === "rejected" ? (
          <p className="reorder-flag">Refusé / Rejected{item.request.note ? ` — ${item.request.note}` : ""}</p>
        ) : null}
        {item.request?.status === "confirmed" ? (
          <p className="reorder-flag">
            La commande a été passée / The Order Has Been Placed
            <small>{formatWhen(item.request.decidedAt)}</small>
          </p>
        ) : null}
      </button>
      {open && tone !== "requested" ? (
        <RequestForm itemId={item.id} onSent={onSent} />
      ) : null}
    </article>
  );
}

function RequestForm({ itemId, onSent }: { itemId: string; onSent: () => void }) {
  const [desiredQty, setDesiredQty] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [name, setName] = useState("");
  const [shift, setShift] = useState<ShiftId>("morning");
  const [signature, setSignature] = useState("");
  const ready =
    desiredQty.trim() !== "" &&
    currentStock.trim() !== "" &&
    name.trim() !== "" &&
    signature !== "";

  return (
    <form
      className="reorder-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        const board = loadBoard();
        saveBoard(
          requestReorder(board, itemId, {
            desiredQty: desiredQty.trim(),
            currentStock: currentStock.trim(),
            name: name.trim(),
            shift,
            signature,
          }),
        );
        onSent();
      }}
    >
      <label>
        Quantité désirée / Desired amount
        <input inputMode="decimal" value={desiredQty} onChange={(event) => setDesiredQty(event.target.value)} />
      </label>
      <label>
        Stock actuel / Current stock
        <input inputMode="decimal" value={currentStock} onChange={(event) => setCurrentStock(event.target.value)} />
      </label>
      <label>
        Nom / Name
        <input value={name} autoCapitalize="words" onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Quart / Shift
        <select value={shift} onChange={(event) => setShift(event.target.value as ShiftId)}>
          {SHIFTS.map((id) => (
            <option key={id} value={id}>
              {shiftLabel(id)}
            </option>
          ))}
        </select>
      </label>
      <SignaturePad label="Signature" value={signature} onChange={setSignature} />
      <button type="submit" className="submit-btn" disabled={!ready}>
        Envoyer la demande / Send request
      </button>
    </form>
  );
}

const REVIEW_PASSWORD = "4321";

export function ReorderReview() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [rejected, setRejected] = useState(false);
  const board = useSyncExternalStore(subscribeBoard, loadBoard, loadBoard);
  const open = board.items.filter((item) => item.request?.status === "requested");

  if (!unlocked) {
    return (
      <main className="overview reorder-page">
        <form
          className="reorder-lock"
          onSubmit={(event) => {
            event.preventDefault();
            if (password === REVIEW_PASSWORD) {
              setUnlocked(true);
              setRejected(false);
              return;
            }
            setRejected(true);
          }}
        >
          <h2>Revue courriel / Email review</h2>
          <label>
            Mot de passe / Password
            <input
              type="password"
              value={password}
              autoComplete="off"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {rejected ? <p>Mot de passe incorrect. / Wrong password.</p> : null}
          <button type="submit" className="submit-btn">
            Entrer / Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="overview reorder-page">
      <p className="overview-lead">
        Revue de la demande, comme dans le courriel. Confirmez la quantité
        commandée au fournisseur, ou refusez.
        <br />
        Request review, as in the email. Confirm the supplier quantity, or reject.
      </p>
      {open.length === 0 ? (
        <p className="overview-lead">Aucune demande en cours. / No open requests.</p>
      ) : (
        <div className="reorder-list">
          {open.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}

function ReviewCard({ item }: { item: ReorderItem }) {
  const request = item.request;
  const [supplierQty, setSupplierQty] = useState("");
  const [placedBy, setPlacedBy] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [note, setNote] = useState("");
  if (!request || request.status !== "requested") return null;
  const canConfirm =
    supplierQty.trim() !== "" && placedBy.trim() !== "" && expectedDelivery !== "";

  function apply(decision: "confirmed" | "rejected") {
    if (decision === "confirmed" && !canConfirm) return;
    saveBoard(
      decideRequest(
        loadBoard(),
        item.id,
        decision,
        supplierQty.trim(),
        note.trim(),
        placedBy.trim(),
        expectedDelivery,
      ),
    );
  }

  return (
    <article className="reorder-card tone-requested">
      <div className="reorder-card-main">
        <header>
          <h2>{item.name}</h2>
          <span>N° {item.sku}</span>
        </header>
        <dl>
          <div>
            <dt>Dernière demande / Last reorder request</dt>
            <dd>{formatWhen(request.requestedAt)}</dd>
          </div>
          <div>
            <dt>Quantité demandée / Requested amount</dt>
            <dd>{request.desiredQty}</dd>
          </div>
          <div>
            <dt>Stock actuel / Current stock</dt>
            <dd>{request.currentStock}</dd>
          </div>
          <div>
            <dt>Demandé par / Requested by</dt>
            <dd>
              {request.name} · {shiftLabel(request.shift)}
            </dd>
          </div>
        </dl>
        {request.signature ? <img className="reorder-sign" src={request.signature} alt="" /> : null}
      </div>
      <form
        className="reorder-form"
        onSubmit={(event) => {
          event.preventDefault();
          apply("confirmed");
        }}
      >
        <label>
          Quantité commandée au fournisseur / Amount ordered from the supplier
          <input inputMode="decimal" value={supplierQty} onChange={(event) => setSupplierQty(event.target.value)} />
        </label>
        <label>
          Commande passée par / Order placed by
          <input value={placedBy} autoCapitalize="words" onChange={(event) => setPlacedBy(event.target.value)} />
        </label>
        <label>
          Livraison prévue / Expected delivery
          <input type="date" value={expectedDelivery} onChange={(event) => setExpectedDelivery(event.target.value)} />
        </label>
        <label>
          Note
          <textarea value={note} rows={2} onChange={(event) => setNote(event.target.value)} />
        </label>
        <div className="reorder-actions">
          <button type="button" className="reorder-reject" onClick={() => apply("rejected")}>
            Refuser / Reject
          </button>
          <button type="submit" className="submit-btn" disabled={!canConfirm}>
            Confirmer / Confirm
          </button>
        </div>
      </form>
    </article>
  );
}
