"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addPerson, removePerson, type FormState } from "@/app/actions/household";
import { MemberAvatar } from "@/components/finance/member-avatar";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";

export interface PersonRow {
  id: string;
  display_name: string;
}

function PersonItem({ person, readOnly }: { person: PersonRow; readOnly: boolean }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex flex-wrap items-center gap-3 border-t py-3 first:border-t-0">
      <MemberAvatar member={person} index={1} size="md" />
      <span className="min-w-0 flex-1 font-semibold">{person.display_name}</span>
      {!readOnly &&
        (confirming ? (
          <form action={removePerson} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={person.id} />
            <span className="text-body text-muted-foreground">Remover {person.display_name}?</span>
            <Button type="submit" variant="secondary" className="min-h-11 border-destructive px-4 text-destructive">
              Remover
            </Button>
            <Button type="button" variant="ghost" className="min-h-11 px-3" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-3 no-underline"
            onClick={() => setConfirming(true)}
            aria-label={`Remover ${person.display_name}`}
          >
            <Trash2 />
          </Button>
        ))}
    </li>
  );
}

export function PeoplePanel({ householdId, people, readOnly = false }: { householdId: string; people: PersonRow[]; readOnly?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addPerson, { status: "idle" });
  const error = state.status === "error" ? state : null;
  // Recria o formulário a cada cadastro salvo, para limpar o campo.
  const formKey = state.status === "saved" ? state.at : "novo";

  return (
    <div className="flex flex-col gap-4">
      {people.length > 0 ? (
        <ul role="list">
          {people.map((p) => (
            <PersonItem key={p.id} person={p} readOnly={readOnly} />
          ))}
        </ul>
      ) : (
        <p className="text-body text-muted-foreground">Ninguém cadastrado ainda.</p>
      )}
      {!readOnly && (
        <form
          key={formKey}
          action={action}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          noValidate
        >
          <input type="hidden" name="householdId" value={householdId} />
          <div className="flex-1">
            <TextField
              label="Nome da pessoa"
              name="displayName"
              maxLength={40}
              placeholder="Ex.: Martha"
              defaultValue={error?.values?.displayName ?? ""}
              error={error ? error.message : undefined}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending} className={error ? "sm:mb-7" : undefined}>
            <Plus /> Adicionar
          </Button>
        </form>
      )}
    </div>
  );
}
