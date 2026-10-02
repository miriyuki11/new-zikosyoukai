'use client';

import React, { useCallback, useState } from 'react';
import { Tag, TagColor } from '@/types/profile';

export interface TagSelectorProps {
  label: string;
  options: Tag[]; // 選択肢となるタグの配列
  selectedTagIds: string[]; // 現在選択されているタグのID配列
  onChange: (selectedIds: string[]) => void; // 選択変更時に呼び出されるコールバック
  maxSelection?: number; // 最大選択数 (undefinedの場合は無制限)
  allowCustomTags?: boolean;
  customTagTriggerId?: string;
  customTagPlaceholder?: string;
  customTagColor?: TagColor;
  className?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  label,
  options,
  selectedTagIds = [],
  onChange,
  maxSelection,
  allowCustomTags = false,
  customTagTriggerId,
  customTagPlaceholder = 'タグ名を入力',
  customTagColor = 'gray',
  className = '',
}) => {
  const [customTagInput, setCustomTagInput] = useState('');

  const visibleOptions = [
    ...options,
    ...selectedTagIds
      .filter((tagId) => !options.some((option) => option.id === tagId))
      .map((tagId) => ({ id: tagId, label: tagId, color: customTagColor })),
  ];

  const handleTagClick = useCallback(
    (tagId: string) => {
      const isSelected = selectedTagIds.includes(tagId);
      let newSelectedIds: string[];

      if (isSelected) {
        // 選択解除
        newSelectedIds = selectedTagIds.filter((id) => id !== tagId);
      } else {
        // 選択
        if (maxSelection && selectedTagIds.length >= maxSelection) {
          // 最大選択数を超過する場合、選択しない
          console.warn(`Maximum selection limit of ${maxSelection} reached.`);
          return;
        }
        newSelectedIds = [...selectedTagIds, tagId];
      }
      onChange(newSelectedIds); // 親コンポーネントに通知
    },
    [onChange, selectedTagIds, maxSelection]
  );

  const addCustomTag = () => {
    const label = customTagInput.trim();
    if (!label) return;

    const existingOption = options.find(
      (option) => option.label.toLocaleLowerCase() === label.toLocaleLowerCase()
    );
    const tagId = existingOption?.id ?? label;
    if (
      selectedTagIds.some((selectedId) => selectedId.toLocaleLowerCase() === tagId.toLocaleLowerCase()) ||
      (maxSelection !== undefined && selectedTagIds.length >= maxSelection)
    ) {
      return;
    }

    onChange([...selectedTagIds, tagId]);
    setCustomTagInput('');
  };

  const getTagColorClass = (color: TagColor, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'red':
          return 'bg-red-500 text-white border-red-600 shadow-xs shadow-red-200';
        case 'blue':
          return 'bg-blue-500 text-white border-blue-600 shadow-xs shadow-blue-200';
        case 'green':
          return 'bg-green-500 text-white border-green-600 shadow-xs shadow-green-200';
        case 'gray':
          return 'bg-gray-700 text-white border-gray-800 shadow-xs shadow-gray-200';
      }
    } else {
      switch (color) {
        case 'red':
          return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300';
        case 'blue':
          return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300';
        case 'green':
          return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300';
        case 'gray':
          return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400';
      }
    }
  };

  const isLimitReached = Boolean(maxSelection && selectedTagIds.length >= maxSelection);

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {maxSelection && (
            <span className="ml-2 text-xs font-normal text-slate-500">
              （最大{maxSelection}個選択 / 選択中: {selectedTagIds.length}個）
            </span>
          )}
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button" // フォーム送信を防ぐ
              onClick={() => handleTagClick(tag.id)}
              className={`
                px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ease-in-out cursor-pointer
                border active:scale-95 select-none
                ${getTagColorClass(tag.color, isSelected)}
              `}
            >
              {isSelected ? `✓ ${tag.label}` : `+ ${tag.label}`}
            </button>
          );
        })}
      </div>

      {allowCustomTags && (!customTagTriggerId || selectedTagIds.includes(customTagTriggerId)) && (
        <div className="mt-3 flex max-w-md gap-2">
          <input
            aria-label={`${label}のカスタムタグ`}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={customTagInput}
            onChange={(event) => setCustomTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomTag();
              }
            }}
            placeholder={customTagPlaceholder}
          />
          <button
            type="button"
            onClick={addCustomTag}
            disabled={!customTagInput.trim() || isLimitReached}
            aria-label={`${label}にタグを追加`}
            className="shrink-0 border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            追加
          </button>
        </div>
      )}

      {isLimitReached && (
        <p className="mt-1.5 text-xs text-amber-600 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
          これ以上タグは選択できません。
        </p>
      )}
    </div>
  );
};

export default TagSelector;
