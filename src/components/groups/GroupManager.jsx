import { useState } from 'react';
import { Settings, X, SmilePlus, Grid, List, ArrowRightLeft, FolderInput, PlusCircle } from 'lucide-react';
import IconPicker, { getIconComponent } from '../ui/IconPicker';

const MoveOptionModal = ({ option, groups, onClose, onMove }) => {
  const [selectedGroup, setSelectedGroup] = useState(option.group_id);
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (selectedGroup === option.group_id) return;
    setLoading(true);
    await onMove(option.id, selectedGroup);
    setLoading(false);
    onClose();
  };

  // Filter out the current group from destination options potentially? 
  // But logic is simpler if we show all and disable current.

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '300px', maxWidth: '90%' }}>
        <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderInput size={18} />
          Move "{option.name}"
        </h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Select a new category for this activity:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              disabled={g.id === option.group_id}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: selectedGroup === g.id ? '2px solid var(--accent-600)' : '1px solid var(--border)',
                background: g.id === option.group_id ? 'var(--surface-hover)' : 'var(--surface)',
                opacity: g.id === option.group_id ? 0.5 : 1,
                textAlign: 'left',
                cursor: g.id === option.group_id ? 'default' : 'pointer',
                fontWeight: selectedGroup === g.id ? 600 : 400
              }}
            >
              {g.name}
              {g.id === option.group_id && " (Current)"}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
          <button
            onClick={handleMove}
            disabled={selectedGroup === option.group_id || loading}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: 'var(--accent-600)', color: 'white', cursor: 'pointer',
              opacity: (selectedGroup === option.group_id || loading) ? 0.5 : 1
            }}
          >
            {loading ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupManager = ({ groups, onCreateGroup, onCreateOption, onMoveOption }) => {
  const [showManager, setShowManager] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [selectedGroupForOption, setSelectedGroupForOption] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingOption, setIsCreatingOption] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Move logic
  const [movingOption, setMovingOption] = useState(null);

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const success = await onCreateGroup(newGroupName.trim());
      if (success) setNewGroupName('');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCreateOption = async () => {
    if (!newOptionName.trim() || !selectedGroupForOption) return;
    setIsCreatingOption(true);
    try {
      const success = await onCreateOption(selectedGroupForOption, newOptionName.trim(), selectedIcon);
      if (success) {
        setNewOptionName('');
        setSelectedIcon(null);
        setShowIconPicker(false);
        // Keep group selected for multiple adds
      }
    } finally {
      setIsCreatingOption(false);
    }
  };

  if (!showManager) {
    return (
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button
          onClick={() => setShowManager(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, var(--accent-bg), var(--accent-bg-2))',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            margin: '0 auto',
            transition: 'all 0.3s ease',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Settings size={16} />
          Manage Categories
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--accent-100)', borderRadius: '8px', color: 'var(--accent-600)' }}>
            <Grid size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>Manage Categories</h3>
        </div>
        <button onClick={() => setShowManager(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
          <X size={20} />
        </button>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${viewMode === 'grid' ? 'var(--accent-600)' : 'var(--border)'}`,
              background: viewMode === 'grid' ? 'var(--accent-bg-soft)' : 'var(--surface)',
              color: viewMode === 'grid' ? 'var(--accent-600)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${viewMode === 'list' ? 'var(--accent-600)' : 'var(--border)'}`,
              background: viewMode === 'list' ? 'var(--accent-bg-soft)' : 'var(--surface)',
              color: viewMode === 'list' ? 'var(--accent-600)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {movingOption && (
        <MoveOptionModal
          option={movingOption}
          groups={groups}
          onClose={() => setMovingOption(null)}
          onMove={onMoveOption}
        />
      )}

      {/* Creation Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* New Group */}
        <div>
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>New Category</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text)' }}
            />
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isCreatingGroup}
              style={{ padding: '0 16px', background: 'var(--accent-600)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
            >
              Add
            </button>
          </div>
        </div>

        {/* New Option */}
        <div>
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>New Activity</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedGroupForOption}
              onChange={(e) => setSelectedGroupForOption(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text)', minWidth: '120px' }}
            >
              <option value="">Category...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                style={{
                  padding: '10px',
                  border: `1px solid ${selectedIcon ? 'var(--accent-600)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  background: selectedIcon ? 'var(--accent-bg-subtle)' : 'var(--bg-primary)',
                  color: selectedIcon ? 'var(--accent-600)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                {selectedIcon ? <span style={{ fontSize: '1.2rem' }}>{getIconComponent(selectedIcon)({}) || <SmilePlus size={18} />}</span> : <SmilePlus size={18} />}
              </button>
              {/* Icon Picker Popover */}
              {showIconPicker && (
                <div style={{ position: 'absolute', top: '160px', left: '20px', width: '280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 50 }}>
                  <IconPicker onSelect={(icon) => { setSelectedIcon(icon); setShowIconPicker(false); }} selectedIcon={selectedIcon} />
                  <div style={{ padding: '8px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                    <button onClick={() => setShowIconPicker(false)} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Activity..."
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateOption()}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text)' }}
              />
              <button
                onClick={handleCreateOption}
                disabled={!newOptionName.trim() || !selectedGroupForOption || isCreatingOption}
                style={{ padding: '0 16px', background: 'var(--accent-600)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)', opacity: 0.9, fontSize: '1rem' }}>Categories & Activities</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {groups.map(group => (
          <div key={group.id} style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{group.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{group.options.length}</span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {group.options.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty</span>
              ) : (
                group.options.map(option => {
                  const Icon = getIconComponent(option.icon);
                  return (
                    <div key={option.id}
                      className="activity-chip"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.85rem',
                        color: 'var(--text)',
                        cursor: 'default',
                        position: 'relative',
                        group: 'group' // tailwind group trick
                      }}
                      title="Click move icon to change category"
                    >
                      {Icon && <Icon size={14} style={{ opacity: 0.7 }} />}
                      {option.name}

                      <button
                        onClick={(e) => { e.stopPropagation(); setMovingOption({ ...option, group_id: group.id }); }}
                        style={{
                          marginLeft: '4px', padding: '2px', borderRadius: '4px',
                          border: 'none', background: 'transparent',
                          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
                        }}
                        className="move-btn"
                        title="Move to another category"
                      >
                        <ArrowRightLeft size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupManager;