import React, { useMemo } from 'react';
import { Modal, Typography, Progress, Tag, Divider } from 'antd';
import { TestConfig, InterpretationRange, AnswerValue } from '../config/tests';

const { Title, Text } = Typography;

function getMaxScoreFromRanges(ranges: InterpretationRange[]): number {
  return ranges.reduce((max, r) => Math.max(max, r.max), 0);
}

function findRange(ranges: InterpretationRange[], score: number): InterpretationRange | undefined {
  return ranges.find(r => score >= r.min && score <= r.max);
}

function severityLabel(sev: InterpretationRange['severity']) {
  switch (sev) {
    case 'low':
      return { text: 'Низкий', color: 'green' as const };
    case 'medium':
      return { text: 'Умеренный', color: 'gold' as const };
    case 'high':
      return { text: 'Высокий', color: 'orange' as const };
    case 'critical':
      return { text: 'Критический', color: 'red' as const };
    default:
      return { text: '—', color: 'default' as const };
  }
}

export type TestResultsModalProps = {
  open: boolean;
  onClose: () => void;
  test: TestConfig;
  score: number;
  answers: Record<number, AnswerValue>;
};

export const TestResultsModal: React.FC<TestResultsModalProps> = ({ open, onClose, test, score, answers }) => {
  const maxScore = useMemo(() => getMaxScoreFromRanges(test.interpretations), [test.interpretations]);
  const range = useMemo(() => findRange(test.interpretations, score), [test.interpretations, score]);
  const sev = range ? severityLabel(range.severity) : null;

  const percent = maxScore > 0 ? Math.round((Math.min(score, maxScore) / maxScore) * 100) : 0;

  const subscaleResults = useMemo(() => {
    if (!test.subscales || test.subscales.length === 0) return [];
    return test.subscales.map(sc => {
      const value = sc.questionIds.reduce((sum, qid) => {
        const v = answers[qid];
        if (Array.isArray(v)) return sum + v.reduce((s, n) => s + Number(n || 0), 0);
        return sum + Number(v || 0);
      }, 0);
      const r = findRange(sc.ranges, value);
      return { ...sc, value, range: r };
    });
  }, [test.subscales, answers]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={720}
      styles={{
        content: { borderRadius: 20, padding: 24 },
        body: { paddingTop: 8 }
      }}
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Результаты: {test.name}
          </Title>
          <Text type="secondary">{test.description}</Text>
        </div>
      }
    >
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <Text type="secondary">Итоговый балл</Text>
            <div>
              <span style={{ fontSize: 34, fontWeight: 700, color: '#2C3E50' }}>{score}</span>
              <span style={{ color: '#7B8794' }}> / {maxScore}</span>
            </div>
          </div>
          {sev && (
            <Tag color={sev.color} style={{ fontSize: 14, padding: '4px 10px', borderRadius: 999 }}>
              {sev.text}
            </Tag>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor={range?.color || '#4F958B'}
            trailColor="rgba(0,0,0,0.06)"
            size={[720, 10]}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <Text type="secondary">0</Text>
            <Text type="secondary">{maxScore}</Text>
          </div>
        </div>

        {range && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: '#F6FFED', border: '1px solid #B7EB8F' }}>
            <Text style={{ color: '#2C3E50', lineHeight: 1.55 }}>{range.text}</Text>
          </div>
        )}

        {subscaleResults.length > 0 && (
          <>
            <Divider style={{ margin: '18px 0' }} />
            <Title level={5} style={{ marginBottom: 12 }}>
              Подшкалы
            </Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {subscaleResults.map(sc => {
                const max = getMaxScoreFromRanges(sc.ranges);
                const pct = max > 0 ? Math.round((Math.min(sc.value, max) / max) * 100) : 0;
                return (
                  <div key={sc.id} style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <Text style={{ fontWeight: 600 }}>{sc.name}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">
                            {sc.value} / {max}
                          </Text>
                        </div>
                      </div>
                      {sc.range && (
                        <Tag color={severityLabel(sc.range.severity).color} style={{ borderRadius: 999 }}>
                          {severityLabel(sc.range.severity).text}
                        </Tag>
                      )}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Progress percent={pct} showInfo={false} strokeColor={sc.range?.color || '#4F958B'} />
                    </div>
                    {sc.range?.text && (
                      <div style={{ marginTop: 10 }}>
                        <Text type="secondary">{sc.range.text}</Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};


