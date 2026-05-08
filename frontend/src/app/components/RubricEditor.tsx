import { Plus, Trash2 } from "lucide-react";
import type { Rubric, Skill } from "../../services/types";

type RubricEditorProps = {
  rubrics: Rubric[];
  availableSkills: Skill[];
  onChange: (rubrics: Rubric[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function RubricEditor({ rubrics, availableSkills, onChange, onAdd, onRemove }: RubricEditorProps) {
  function updateRubric(id: string, patch: Partial<Rubric>) {
    onChange(
      rubrics.map((rubric) => {
        if (rubric.id !== id) return rubric;
        const next = { ...rubric, ...patch };
        if (patch.name !== undefined) next.title = patch.name || patch.title || rubric.title;
        if (patch.title !== undefined) next.name = patch.title || patch.name || rubric.name;
        if (patch.scoringGuidance !== undefined) next.expectedScoring = patch.scoringGuidance;
        return next;
      }),
    );
  }

  function toggleSkill(rubric: Rubric, skillId: string) {
    const current = rubric.linkedSkillIds || rubric.skillLinks?.map((link) => link.skillId) || [];
    const linkedSkillIds = current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId];
    updateRubric(rubric.id, {
      linkedSkillIds,
      skillLinks: linkedSkillIds.map((id) => ({ skillId: id, weight: 1 })),
    });
  }

  return (
    <div className="space-y-5">
      {rubrics.map((rubric, index) => {
        const linkedSkillIds = rubric.linkedSkillIds || rubric.skillLinks?.map((link) => link.skillId) || [];
        return (
          <div key={rubric.id} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm p-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-widest font-medium text-stone-500">Rubric {index + 1}</p>
              <button
                type="button"
                onClick={() => onRemove(rubric.id)}
                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                aria-label="Remove rubric"
              >
                <Trash2 className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="grid md:grid-cols-[1fr_120px] gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">Name</label>
                <input
                  value={rubric.name || rubric.title}
                  onChange={(event) => updateRubric(rubric.id, { name: event.target.value, title: event.target.value })}
                  className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">Weight</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={rubric.weight ?? 1}
                  onChange={(event) => updateRubric(rubric.id, { weight: Number(event.target.value) })}
                  className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">Description</label>
              <textarea
                value={rubric.description}
                onChange={(event) => updateRubric(rubric.id, { description: event.target.value, lookingFor: event.target.value })}
                className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all h-24 resize-none rounded-sm font-light text-stone-800 dark:text-stone-200"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">Scoring Guidance</label>
              <textarea
                value={rubric.scoringGuidance || rubric.expectedScoring || ""}
                onChange={(event) => updateRubric(rubric.id, { scoringGuidance: event.target.value, expectedScoring: event.target.value })}
                className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all h-24 resize-none rounded-sm font-light text-stone-800 dark:text-stone-200"
              />
            </div>

            {availableSkills.length > 0 && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-3">Skill Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.slice(0, 18).map((skill) => {
                    const selected = linkedSkillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(rubric, skill.id)}
                        className={`px-3 py-1.5 border rounded-sm text-xs font-light transition-colors ${
                          selected
                            ? "border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 bg-[#F4F3F0] dark:bg-[#1A1A1A]"
                            : "border-stone-200 dark:border-stone-700 text-stone-500 hover:border-stone-400 dark:hover:border-stone-500"
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-3 px-5 py-3 border border-stone-300 dark:border-stone-700 rounded-sm text-sm font-medium text-stone-700 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-500 transition-colors bg-transparent"
      >
        <Plus className="w-4 h-4 stroke-[1.5]" /> Add Rubric
      </button>
    </div>
  );
}
