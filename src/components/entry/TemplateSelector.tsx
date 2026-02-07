import { FileText, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// ========== Types ==========

interface Template {
  id: string;
  name: string;
  icon: string;
  content: string;
}

interface TemplateSelectorProps {
  onSelectTemplate: (content: string) => void;
}

// ========== Data ==========

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    icon: '📝',
    content: `## What went well today?

## What could have been better?

## What am I grateful for?
`
  },
  {
    id: 'anxiety-checkin',
    name: 'Anxiety Check-in',
    icon: '🧠',
    content: `## Current anxiety level (1-10):

## What triggered it?

## Physical symptoms:

## Coping strategies used:
`
  },
  {
    id: 'sleep-log',
    name: 'Sleep Log',
    icon: '😴',
    content: `## Hours slept:

## Sleep quality (1-10):

## Dreams or interruptions:

## Energy level upon waking:
`
  },
  {
    id: 'gratitude',
    name: 'Gratitude Journal',
    icon: '🙏',
    content: `## Three things I'm grateful for today:
1.
2.
3.

## One person I appreciate and why:

## Something small that made me smile:
`
  },
  {
    id: 'goals',
    name: 'Goals & Progress',
    icon: '🎯',
    content: `## Today's main goal:

## Progress made:

## Obstacles encountered:

## Tomorrow's priority:
`
  }
];

// ========== Component ==========

const TemplateSelector = ({ onSelectTemplate }: TemplateSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <FileText size={16} />
          Load Template
          <ChevronDown size={14} className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {DEFAULT_TEMPLATES.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelectTemplate(template.content)}
            className="gap-3 py-3 cursor-pointer"
          >
            <span className="text-xl leading-none">{template.icon}</span>
            <span className="font-medium">{template.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplateSelector;
