import { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import AchievementNFT, {
  AchievementIconKey,
  isAchievementIconKey,
} from '../components/nft/AchievementNFT';
import apiService, {
  AchievementDefinition,
  AchievementProgressDTO,
} from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';

type FilterMode = 'all' | 'locked' | 'unlocked';
type SortMode = 'near' | 'rarity' | 'progress' | 'name';
type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

interface AchievementCardModel {
  definition: AchievementDefinition;
  current: number;
  max: number;
  percent: number;
  isUnlocked: boolean;
  displayName: string;
  displayDescription: string;
  displayIcon: AchievementIconKey;
  rarityWeight: number;
  isSecretLocked: boolean;
}

const rarityWeightMap: Record<AchievementRarity, number> = {
  legendary: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const toSafeIconKey = (icon: string, fallback: AchievementIconKey = 'Zap'): AchievementIconKey =>
  isAchievementIconKey(icon) ? icon : fallback;

const AchievementsView = () => {
  const [definitions, setDefinitions] = useState<AchievementDefinition[]>([]);
  const [progressRows, setProgressRows] = useState<AchievementProgressDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState<AchievementCardModel | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('near');

  useEffect(() => {
    let cancelled = false;
    const loadAchievements = async () => {
      try {
        setLoading(true);
        const [definitionsData, progressData] = await Promise.all([
          apiService.getAchievementDefinitions(),
          apiService.getAchievementsProgress(),
        ]);
        if (cancelled) return;
        setDefinitions(definitionsData || []);
        setProgressRows(progressData || []);
      } catch (err) {
        if (cancelled) return;
        setError('Failed to load achievements');
        console.error('Failed to load achievements:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAchievements();
    return () => {
      cancelled = true;
    };
  }, []);

  const achievementCards = useMemo(() => {
    const progressMap = new Map(
      progressRows.map((row) => [row.achievement_type, row] as const)
    );

    const cards: AchievementCardModel[] = definitions.map((definition) => {
      const progress = progressMap.get(definition.achievement_type);
      const current = Math.max(0, progress?.current ?? 0);
      const max = Math.max(1, progress?.max ?? definition.target ?? 1);
      const percent = Math.max(
        0,
        Math.min(100, progress?.percent ?? Math.round((current / max) * 100))
      );
      const isUnlocked = Boolean(progress?.is_unlocked);
      const isSecretLocked = Boolean(definition.secret && !isUnlocked);

      return {
        definition,
        current,
        max,
        percent,
        isUnlocked,
        isSecretLocked,
        displayName: isSecretLocked ? 'Hidden Achievement' : definition.name,
        displayDescription: isSecretLocked
          ? 'Unlock this achievement to reveal details.'
          : definition.description,
        displayIcon: isSecretLocked
          ? 'Lock'
          : toSafeIconKey(definition.icon, 'Zap'),
        rarityWeight: rarityWeightMap[definition.rarity as AchievementRarity] || 1,
      };
    });

    return cards
      .filter((card) => {
        if (filterMode === 'locked') return !card.isUnlocked;
        if (filterMode === 'unlocked') return card.isUnlocked;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'name') return a.displayName.localeCompare(b.displayName);
        if (sortMode === 'rarity') return b.rarityWeight - a.rarityWeight;
        if (sortMode === 'progress') return b.percent - a.percent;
        // near-unlock default
        if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? 1 : -1;
        return b.percent - a.percent;
      });
  }, [definitions, progressRows, filterMode, sortMode]);

  const unlockedCount = achievementCards.filter((card) => card.isUnlocked).length;
  const totalCount = definitions.length;

  if (loading) {
    return (
      <div className="mt-6 text-center text-muted-foreground">Loading achievements...</div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-center text-destructive">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Trophy size={22} />
            </span>
            Achievements
          </h1>
          <p className="text-sm text-muted-foreground">
            {unlockedCount}/{totalCount} unlocked • prioritize near-unlock achievements for quick wins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="unlocked">Unlocked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="near">Near Unlock</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {achievementCards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No achievements match this filter.
          </CardContent>
        </Card>
      ) : (
        <div data-testid="achievements-grid-shell" className="mx-auto w-full lg:max-w-[calc(4*12rem+3*1.25rem)] xl:max-w-[calc(5*12rem+4*1.25rem)] 2xl:max-w-[calc(6*12rem+5*1.25rem)]">
          <ResponsiveGrid data-testid="achievements-grid" minCardWidth="12rem" gapToken="normal">
            {achievementCards.map((card) => (
              <button
                key={card.definition.achievement_type}
                onClick={() => setActive(card)}
                className="text-left block w-full bg-transparent border-none p-0"
                type="button"
              >
                <AchievementNFT
                  achievement={{
                    name: card.displayName,
                    description: card.displayDescription,
                    icon: card.displayIcon,
                    rarity: card.definition.rarity,
                  }}
                  isUnlocked={card.isUnlocked}
                  progressValue={card.isUnlocked ? undefined : card.current}
                  progressMax={card.max}
                />
              </button>
            ))}
          </ResponsiveGrid>
        </div>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.displayName || 'Achievement'}
      >
        <p style={{ marginTop: 0 }}>{active?.displayDescription}</p>
        {active && !active.isUnlocked && (
          <ProgressBar value={active.current} max={active.max} label="Progress to unlock" />
        )}
        {active && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            {active.isSecretLocked
              ? 'Keep logging and maintaining momentum to reveal this secret achievement.'
              : 'Tips: daily logging, streak consistency, and goal completion unlock achievements fastest.'}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AchievementsView;
