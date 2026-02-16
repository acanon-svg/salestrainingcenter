import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { MindMapData } from "../types";

interface Props {
  data: MindMapData;
  onChange: (data: MindMapData) => void;
}

export const MindMapEditor: React.FC<Props> = ({ data, onChange }) => {
  const addGroup = () => {
    const id = `g${Date.now()}`;
    onChange({ ...data, groups: [...data.groups, { id, label: "" }] });
  };

  const addConcept = () => {
    const id = `c${Date.now()}`;
    onChange({
      ...data,
      concepts: [...data.concepts, { id, text: "", correct_group_id: data.groups[0]?.id || "" }],
    });
  };

  const updateGroup = (index: number, label: string) => {
    const groups = [...data.groups];
    groups[index] = { ...groups[index], label };
    onChange({ ...data, groups });
  };

  const removeGroup = (index: number) => {
    const removedId = data.groups[index].id;
    const groups = data.groups.filter((_, i) => i !== index);
    const concepts = data.concepts.map(c =>
      c.correct_group_id === removedId ? { ...c, correct_group_id: groups[0]?.id || "" } : c
    );
    onChange({ ...data, groups, concepts });
  };

  const updateConcept = (index: number, field: "text" | "correct_group_id", value: string) => {
    const concepts = [...data.concepts];
    concepts[index] = { ...concepts[index], [field]: value };
    onChange({ ...data, concepts });
  };

  const removeConcept = (index: number) => {
    onChange({ ...data, concepts: data.concepts.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Grupos (categorías)</label>
        <div className="space-y-2">
          {data.groups.map((group, i) => (
            <div key={group.id} className="flex items-center gap-2">
              <Input
                placeholder={`Grupo ${i + 1}`}
                value={group.label}
                onChange={e => updateGroup(i, e.target.value)}
              />
              {data.groups.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => removeGroup(i)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addGroup}>
            <Plus className="w-3 h-3 mr-1" /> Agregar grupo
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Conceptos a clasificar</label>
        <div className="space-y-2">
          {data.concepts.map((concept, i) => (
            <div key={concept.id} className="flex items-center gap-2">
              <Input
                placeholder="Texto del concepto"
                value={concept.text}
                onChange={e => updateConcept(i, "text", e.target.value)}
                className="flex-1"
              />
              <Select
                value={concept.correct_group_id}
                onValueChange={v => updateConcept(i, "correct_group_id", v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {data.groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.label || "Sin nombre"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {data.concepts.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => removeConcept(i)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addConcept}>
            <Plus className="w-3 h-3 mr-1" /> Agregar concepto
          </Button>
        </div>
      </div>
    </div>
  );
};
