import {
  SHIFT_META,
  orderCanSubmit,
  orderSectionsHaveContent,
  type OrderList,
  type ShiftId,
} from "../model";
import { FormLockBar } from "./FormLockBar";
import { NoteField, QtyField } from "./Fields";

interface DailyOrderFormProps {
  shift: ShiftId;
  value: OrderList;
  locked?: boolean;
  onChange: (next: OrderList) => void;
  onSubmit?: () => void;
}

export function DailyOrderForm({
  shift,
  value,
  locked = false,
  onChange,
  onSubmit,
}: DailyOrderFormProps) {
  const meta = SHIFT_META[shift];
  const ladder = value.ladder;
  const grill = value.grill;
  const oem = value.oem;
  const linear = value.linear;
  const diffuser = value.diffuser;
  const boxFilled = value.boxUsed.trim().length > 0;
  const listFilled = orderSectionsHaveContent(value);
  const canSubmit = orderCanSubmit(value);
  const submitHint =
    boxFilled && listFilled
      ? "Vérifiez, puis envoyez. / Review, then submit."
      : !boxFilled && !listFilled
        ? "Remplissez la liste de commandes et BOX USED avant d'envoyer. / Fill in the order list and BOX USED before submitting."
        : !boxFilled
          ? "BOX USED doit être rempli avant d'envoyer. / BOX USED must be filled before submitting."
          : "La liste de commandes doit être remplie avant d'envoyer. / The order list must be filled before submitting.";

  return (
    <article
      className={`paper-form order-form shift-${shift} ${locked ? "is-locked" : ""}`}
    >
      <header className="order-header">
        <h1>
          LISTE DES COMMANDES DU LIGNE DE PEINTURE
          <small>PAINTLINE DAILY ORDER LIST</small>
        </h1>
        <div className="shift-banner">
          <span className="moon-or-sun" aria-hidden>
            {meta.icon}
          </span>
          <div>
            <strong>
              {meta.fr.toUpperCase()} / {meta.en.toUpperCase()}
            </strong>
          </div>
          <span className="moon-or-sun" aria-hidden>
            {meta.icon}
          </span>
        </div>
      </header>
      {locked ? (
        <FormLockBar
          locked
          submittedAt={value.submittedAt}
          onSubmit={() => undefined}
        />
      ) : null}
      <fieldset className="form-lock" disabled={locked}>

      <div className="two-col">
        <section className="block">
          <h2>ÉCHELLE / LADDER</h2>
          <div className="center-qty">
            <QtyField
              label="Qté / Qty"
              value={ladder.qty}
              onChange={(qty) =>
                onChange({ ...value, ladder: { ...ladder, qty } })
              }
            />
          </div>
          <div className="grid-4">
            <QtyField
              label="Déclaration en suspens / Outstanding Declaration"
              value={ladder.outstanding}
              onChange={(outstanding) =>
                onChange({ ...value, ladder: { ...ladder, outstanding } })
              }
            />
            <QtyField
              label="RUSH"
              value={ladder.rush}
              onChange={(rush) =>
                onChange({ ...value, ladder: { ...ladder, rush } })
              }
            />
            <QtyField
              label="SUPER RUSH"
              value={ladder.superRush}
              onChange={(superRush) =>
                onChange({ ...value, ladder: { ...ladder, superRush } })
              }
            />
            <QtyField
              label="AUTRES / OTHER"
              value={ladder.other}
              onChange={(other) =>
                onChange({ ...value, ladder: { ...ladder, other } })
              }
            />
          </div>
          <NoteField
            label="Type & Quantity / Type et quantité"
            value={ladder.typeQty}
            onChange={(typeQty) =>
              onChange({ ...value, ladder: { ...ladder, typeQty } })
            }
          />
        </section>

        <section className="block">
          <h2>GRILL / STD</h2>
          <div className="grid-4">
            <QtyField
              label="Cadre SD / Frame SD"
              value={grill.frameSD}
              onChange={(frameSD) =>
                onChange({ ...value, grill: { ...grill, frameSD } })
              }
            />
            <QtyField
              label="Cadre DD / Frame DD"
              value={grill.frameDD}
              onChange={(frameDD) =>
                onChange({ ...value, grill: { ...grill, frameDD } })
              }
            />
            <QtyField
              label="Cadre ER / Frame ER"
              value={grill.frameER}
              onChange={(frameER) =>
                onChange({ ...value, grill: { ...grill, frameER } })
              }
            />
            <QtyField
              label="Cadre PF / Frame PF"
              value={grill.framePF}
              onChange={(framePF) =>
                onChange({ ...value, grill: { ...grill, framePF } })
              }
            />
          </div>
          <div className="grid-4">
            <QtyField
              label="Déclaration en suspens / Outstanding Declaration"
              value={grill.outstanding}
              onChange={(outstanding) =>
                onChange({ ...value, grill: { ...grill, outstanding } })
              }
            />
            <QtyField
              label="RUSH / SUPER RUSH"
              value={grill.rushSuperRush}
              onChange={(rushSuperRush) =>
                onChange({ ...value, grill: { ...grill, rushSuperRush } })
              }
            />
            <QtyField
              label="Cadre SF / Frame SF"
              value={grill.frameSF}
              onChange={(frameSF) =>
                onChange({ ...value, grill: { ...grill, frameSF } })
              }
            />
            <QtyField
              label="Cadre HF / Frame HF"
              value={grill.frameHF}
              onChange={(frameHF) =>
                onChange({ ...value, grill: { ...grill, frameHF } })
              }
            />
          </div>
          <NoteField
            label="Type & Quantity / Type et quantité"
            value={grill.typeQty}
            onChange={(typeQty) =>
              onChange({ ...value, grill: { ...grill, typeQty } })
            }
          />
        </section>
      </div>

      <div className="two-col">
        <section className="block">
          <h2>OEM</h2>
          <div className="grid-3">
            <QtyField
              label="Panneau court et long / Short & Long Pannel (50 & -)"
              value={oem.shortLongPanel}
              onChange={(shortLongPanel) =>
                onChange({ ...value, oem: { ...oem, shortLongPanel } })
              }
            />
            <QtyField
              label="Panneau super long / Super Long Pannel (51-80)"
              value={oem.superLongPanel}
              onChange={(superLongPanel) =>
                onChange({ ...value, oem: { ...oem, superLongPanel } })
              }
            />
            <QtyField
              label="Panneau extra long / Extra Long Pannel (80 +)"
              value={oem.extraLongPanel}
              onChange={(extraLongPanel) =>
                onChange({ ...value, oem: { ...oem, extraLongPanel } })
              }
            />
            <QtyField
              label="Cadre court et long / Short & Long Frame (50 & -)"
              value={oem.shortLongFrame}
              onChange={(shortLongFrame) =>
                onChange({ ...value, oem: { ...oem, shortLongFrame } })
              }
            />
            <QtyField
              label="Cadre super long / Super Long Frame (51-80)"
              value={oem.superLongFrame}
              onChange={(superLongFrame) =>
                onChange({ ...value, oem: { ...oem, superLongFrame } })
              }
            />
            <QtyField
              label="Cadre extra long / Extra Long Frame (80 +)"
              value={oem.extraLongFrame}
              onChange={(extraLongFrame) =>
                onChange({ ...value, oem: { ...oem, extraLongFrame } })
              }
            />
          </div>
        </section>

        <section className="block">
          <h2>LINEAR</h2>
          <div className="grid-2">
            <QtyField
              label="Cadres / Frames (PCS)"
              value={linear.frames}
              onChange={(frames) =>
                onChange({ ...value, linear: { ...linear, frames } })
              }
            />
            <QtyField
              label="Cores"
              value={linear.cores}
              onChange={(cores) =>
                onChange({ ...value, linear: { ...linear, cores } })
              }
            />
          </div>
          <div className="grid-4">
            <QtyField
              label="Déclaration en suspens / Outstanding Declaration"
              value={linear.outstanding}
              onChange={(outstanding) =>
                onChange({ ...value, linear: { ...linear, outstanding } })
              }
            />
            <QtyField
              label="RUSH"
              value={linear.rush}
              onChange={(rush) =>
                onChange({ ...value, linear: { ...linear, rush } })
              }
            />
            <QtyField
              label="SUPER RUSH"
              value={linear.superRush}
              onChange={(superRush) =>
                onChange({ ...value, linear: { ...linear, superRush } })
              }
            />
            <QtyField
              label="AUTRES / OTHER"
              value={linear.other}
              onChange={(other) =>
                onChange({ ...value, linear: { ...linear, other } })
              }
            />
          </div>
          <NoteField
            label="Type & Quantity / Type et quantité"
            value={linear.typeQty}
            onChange={(typeQty) =>
              onChange({ ...value, linear: { ...linear, typeQty } })
            }
          />
        </section>
      </div>

      <section className="block">
        <h2>DIFFUSER</h2>
        <div className="grid-7">
          <QtyField
            label="6"
            value={diffuser.size6}
            onChange={(size6) =>
              onChange({ ...value, diffuser: { ...diffuser, size6 } })
            }
          />
          <QtyField
            label="8"
            value={diffuser.size8}
            onChange={(size8) =>
              onChange({ ...value, diffuser: { ...diffuser, size8 } })
            }
          />
          <QtyField
            label="10"
            value={diffuser.size10}
            onChange={(size10) =>
              onChange({ ...value, diffuser: { ...diffuser, size10 } })
            }
          />
          <QtyField
            label="12"
            value={diffuser.size12}
            onChange={(size12) =>
              onChange({ ...value, diffuser: { ...diffuser, size12 } })
            }
          />
          <QtyField
            label="14"
            value={diffuser.size14}
            onChange={(size14) =>
              onChange({ ...value, diffuser: { ...diffuser, size14 } })
            }
          />
          <QtyField
            label="0"
            value={diffuser.size0}
            onChange={(size0) =>
              onChange({ ...value, diffuser: { ...diffuser, size0 } })
            }
          />
          <QtyField
            label="AUTRES / OTHER"
            value={diffuser.autres}
            onChange={(autres) =>
              onChange({ ...value, diffuser: { ...diffuser, autres } })
            }
          />
        </div>
        <div className="grid-8">
          <QtyField
            label="ISO"
            value={diffuser.iso}
            onChange={(iso) =>
              onChange({ ...value, diffuser: { ...diffuser, iso } })
            }
          />
          <QtyField
            label="Petit cône / Small Cone"
            value={diffuser.smallCone}
            onChange={(smallCone) =>
              onChange({ ...value, diffuser: { ...diffuser, smallCone } })
            }
          />
          <QtyField
            label="Cône moyen / Middle Cone"
            value={diffuser.middleCone}
            onChange={(middleCone) =>
              onChange({ ...value, diffuser: { ...diffuser, middleCone } })
            }
          />
          <QtyField
            label="Grand cône / Large Cone"
            value={diffuser.largeCone}
            onChange={(largeCone) =>
              onChange({ ...value, diffuser: { ...diffuser, largeCone } })
            }
          />
          <QtyField
            label="3 Cone Cupe / 3 Cupe Cone"
            value={diffuser.threeCupeCone}
            onChange={(threeCupeCone) =>
              onChange({ ...value, diffuser: { ...diffuser, threeCupeCone } })
            }
          />
          <QtyField
            label="PERF"
            value={diffuser.perf}
            onChange={(perf) =>
              onChange({ ...value, diffuser: { ...diffuser, perf } })
            }
          />
          <QtyField
            label="DSW"
            value={diffuser.dsw}
            onChange={(dsw) =>
              onChange({ ...value, diffuser: { ...diffuser, dsw } })
            }
          />
          <QtyField
            label="AUTRE / OTHER"
            value={diffuser.autre2}
            onChange={(autre2) =>
              onChange({ ...value, diffuser: { ...diffuser, autre2 } })
            }
          />
        </div>
        <div className="grid-8">
          <QtyField
            label="Déclaration en suspens / Outstanding Declaration"
            value={diffuser.outstanding}
            onChange={(outstanding) =>
              onChange({ ...value, diffuser: { ...diffuser, outstanding } })
            }
          />
          <QtyField
            label="CORE 12"
            value={diffuser.core12}
            onChange={(core12) =>
              onChange({ ...value, diffuser: { ...diffuser, core12 } })
            }
          />
          <QtyField
            label="ISO 12"
            value={diffuser.iso12}
            onChange={(iso12) =>
              onChange({ ...value, diffuser: { ...diffuser, iso12 } })
            }
          />
          <QtyField
            label="SHELL 12"
            value={diffuser.shell12}
            onChange={(shell12) =>
              onChange({ ...value, diffuser: { ...diffuser, shell12 } })
            }
          />
          <QtyField
            label="ALUM DF"
            value={diffuser.alumDf}
            onChange={(alumDf) =>
              onChange({ ...value, diffuser: { ...diffuser, alumDf } })
            }
          />
          <QtyField
            label="COLLETS"
            value={diffuser.collets}
            onChange={(collets) =>
              onChange({ ...value, diffuser: { ...diffuser, collets } })
            }
          />
          <QtyField
            label="RUSH / SUPER RUSH"
            value={diffuser.rushSuperRush}
            onChange={(rushSuperRush) =>
              onChange({ ...value, diffuser: { ...diffuser, rushSuperRush } })
            }
          />
          <QtyField
            label="AUTRE / OTHER"
            value={diffuser.autre3}
            onChange={(autre3) =>
              onChange({ ...value, diffuser: { ...diffuser, autre3 } })
            }
          />
        </div>
        <NoteField
          label="Type et quantité / Type & Quantity"
          value={diffuser.typeQty}
          onChange={(typeQty) =>
            onChange({ ...value, diffuser: { ...diffuser, typeQty } })
          }
        />
      </section>

      <footer className="order-footer">
        <NoteField
          className="other-notes"
          label="Autre / Other"
          value={value.other}
          onChange={(other) => onChange({ ...value, other })}
        />
        <QtyField
          className={`box-used${boxFilled ? "" : " is-missing"}`}
          label="BOX USED *"
          required
          aria-required="true"
          value={value.boxUsed}
          onChange={(boxUsed) => onChange({ ...value, boxUsed })}
        />
      </footer>
      </fieldset>
      {locked || !onSubmit ? null : (
        <>
          <p className="form-need">{submitHint}</p>
          <FormLockBar locked={false} disabled={!canSubmit} onSubmit={onSubmit} />
        </>
      )}
    </article>
  );
}
