import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastProvider';
import Skeleton from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import './UiDemo.css';

const UiDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { show } = useToast();

  return (
    <div className="ui-demo">
      <header className="ui-demo__header">
        <p className="ui-demo__eyebrow">UI Demo</p>
        <h1>Custom UI Components</h1>
        <p className="ui-demo__subtitle">A quick overview of the current in-app components.</p>
      </header>

      <div className="ui-demo__grid" role="table" aria-label="UI component samples">
        <div className="ui-demo__head" role="rowgroup">
          <div className="ui-demo__cell ui-demo__cell--head" role="columnheader">Component</div>
          <div className="ui-demo__cell ui-demo__cell--head" role="columnheader">Current</div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">Modal</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__stack">
              <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}>
                Open modal
              </button>
              <Modal open={isModalOpen} title="Modal demo" onClose={() => setIsModalOpen(false)}>
                <p style={{ marginTop: 0 }}>
                  This modal uses the shared Modal component with the current theme tokens.
                </p>
                <div className="ui-demo__inline">
                  <button className="btn btn-outline" type="button" onClick={() => setIsModalOpen(false)}>
                    Close
                  </button>
                </div>
              </Modal>
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">ToastProvider</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__inline">
              <button className="btn btn-primary" type="button" onClick={() => show('Success toast fired', 'success')}>
                Success
              </button>
              <button className="btn btn-outline" type="button" onClick={() => show('Something went wrong', 'error')}>
                Error
              </button>
              <button className="btn btn-outline" type="button" onClick={() => show('Heads up: info toast', 'info')}>
                Info
              </button>
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">Skeleton</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__stack">
              <Skeleton height={18} width="70%" />
              <Skeleton height={12} width="90%" />
              <Skeleton height={12} width="60%" />
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">ProgressBar</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__stack">
              <ProgressBar label="Weekly progress" value={42} max={100} />
              <ProgressBar label="Monthly goal" value={68} max={100} />
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">Buttons</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__inline">
              <button className="btn btn-primary" type="button">
                Primary action
              </button>
              <button className="btn btn-outline" type="button">
                Secondary action
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UiDemo;
