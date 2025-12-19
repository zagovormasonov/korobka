import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Progress, Typography, message, Space, Radio, Checkbox, Slider, Spin } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { getTestConfig, Question, TestConfig } from '../config/tests';
import { apiRequest } from '../config/api';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

type AnswerValue = number | number[];

type SavedProgress = {
  testId: string;
  currentIndex: number;
  answers: Record<number, AnswerValue>;
  completed?: boolean;
  completedAt?: string;
  score?: number;
};

const getProgressKey = (testId: string) => `test_progress_${testId}`;

const defaultComputeScore = (answers: Record<number, AnswerValue>) => {
  return Object.values(answers).reduce((sum, v) => {
    if (Array.isArray(v)) return sum + v.reduce((s, n) => s + Number(n || 0), 0);
    return sum + Number(v || 0);
  }, 0);
};

const findInterpretation = (test: TestConfig, score: number) => {
  return test.interpretations.find(r => score >= r.min && score <= r.max);
};

const AdditionalTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { isAuthenticated, isLoading: authLoading, authData } = useAuth();

  const test = useMemo(() => (testId ? getTestConfig(testId) : undefined), [testId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Guard: auth
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/lk/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Restore progress
  useEffect(() => {
    if (!testId) return;
    const raw = localStorage.getItem(getProgressKey(testId));
    if (!raw) return;
    try {
      const saved: SavedProgress = JSON.parse(raw);
      if (saved?.testId !== testId) return;
      setCurrentIndex(saved.currentIndex || 0);
      setAnswers(saved.answers || {});
      setCompleted(!!saved.completed);
      if (typeof saved.score === 'number') setScore(saved.score);
      if (saved.currentIndex > 0 || Object.keys(saved.answers || {}).length > 0) {
        message.success({ content: 'Восстановлен прогресс теста', duration: 2 });
      }
    } catch (e) {
      console.error('❌ Ошибка восстановления прогресса теста:', e);
      localStorage.removeItem(getProgressKey(testId));
    }
  }, [testId]);

  // Persist progress
  useEffect(() => {
    if (!testId) return;
    if (!test) return;
    const payload: SavedProgress = {
      testId,
      currentIndex,
      answers,
      completed,
      score: score ?? undefined,
      completedAt: completed ? new Date().toISOString() : undefined
    };
    localStorage.setItem(getProgressKey(testId), JSON.stringify(payload));
  }, [testId, test, currentIndex, answers, completed, score]);

  const questions = test?.questions || [];
  const total = questions.length;
  const progress = total > 0 ? Math.round(((Math.min(currentIndex, total) + 1) / total) * 100) : 0;

  const currentQuestion: Question | undefined = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const setAnswer = (questionId: number, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canGoNext = () => {
    if (!currentQuestion) return false;
    const v = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiple') {
      return Array.isArray(v) && v.length > 0;
    }
    if (currentQuestion.type === 'scale') {
      return typeof v === 'number';
    }
    return typeof v === 'number';
  };

  const computeScore = () => {
    if (!test) return 0;
    if (typeof test.calculateScore === 'function') {
      // For now we only pass numeric answers (scale/single) to custom scorer
      const numericAnswers: Record<number, number> = {};
      Object.entries(answers).forEach(([qid, v]) => {
        if (typeof v === 'number') numericAnswers[Number(qid)] = v;
      });
      return test.calculateScore(numericAnswers);
    }
    return defaultComputeScore(answers);
  };

  const handleSubmit = async () => {
    if (!testId || !test) return;
    const computed = computeScore();
    setScore(computed);
    setCompleted(true);

    // Persist to backend (current API stores answers as string; next todo will migrate to JSONB)
    // We save a JSON string now to keep backward compatibility.
    if (authData?.sessionId) {
      try {
        setSaving(true);
        const payload = {
          testId: test.id,
          testName: test.name,
          score: computed,
          answers
        };
        await apiRequest('api/tests/additional/save-result', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: authData.sessionId,
            testName: test.name,
            testUrl: `internal:${test.id}`,
            testResult: JSON.stringify(payload)
          })
        });
      } catch (e) {
        console.error('❌ Ошибка сохранения результата доп. теста:', e);
        message.warning('Не удалось сохранить результат на сервере, но он сохранен в браузере');
      } finally {
        setSaving(false);
      }
    }
  };

  const restartTest = () => {
    if (!testId) return;
    localStorage.removeItem(getProgressKey(testId));
    setAnswers({});
    setCurrentIndex(0);
    setCompleted(false);
    setScore(null);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!testId || !test) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 20 }}>
        <Card style={{ borderRadius: 16 }}>
          <Title level={3}>Тест не найден</Title>
          <Text type="secondary">Похоже, такого теста в системе пока нет.</Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Вернуться в личный кабинет
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const interpretation = score !== null ? findInterpretation(test, score) : undefined;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Progress percent={progress} showInfo={false} strokeColor="#4F958B" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text type="secondary">
            {completed ? 'Тест завершён' : `Вопрос ${currentIndex + 1} из ${total}`}
          </Text>
          <Button type="text" danger onClick={() => navigate('/dashboard')}>
            Выйти
          </Button>
        </div>
      </div>

      <Card style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <Title level={3} style={{ marginTop: 0 }}>
          {test.name}
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {test.description}
        </Text>

        {!completed && currentQuestion && (
          <>
            <Title level={4} style={{ marginTop: 8 }}>
              {currentQuestion.text}
            </Title>

            {currentQuestion.type === 'single' && (
              <Radio.Group
                value={typeof currentAnswer === 'number' ? currentAnswer : undefined}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                style={{ width: '100%', marginTop: 12 }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(currentQuestion.options || []).map(opt => (
                    <Radio key={String(opt.id)} value={opt.value} style={{ width: '100%' }}>
                      {opt.text}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            )}

            {currentQuestion.type === 'multiple' && (
              <Checkbox.Group
                value={Array.isArray(currentAnswer) ? currentAnswer : []}
                onChange={(vals) => setAnswer(currentQuestion.id, vals as number[])}
                style={{ width: '100%', marginTop: 12 }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(currentQuestion.options || []).map(opt => (
                    <Checkbox key={String(opt.id)} value={opt.value}>
                      {opt.text}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            )}

            {currentQuestion.type === 'scale' && (
              <div style={{ marginTop: 12 }}>
                <Slider
                  min={currentQuestion.scaleConfig?.min ?? 0}
                  max={currentQuestion.scaleConfig?.max ?? 3}
                  value={typeof currentAnswer === 'number' ? currentAnswer : (currentQuestion.scaleConfig?.min ?? 0)}
                  onChange={(v) => setAnswer(currentQuestion.id, v as number)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{currentQuestion.scaleConfig?.minLabel}</Text>
                  <Text type="secondary">{currentQuestion.scaleConfig?.maxLabel}</Text>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                Назад
              </Button>

              <Button
                type="primary"
                icon={currentIndex === total - 1 ? <BarChartOutlined /> : <ArrowRightOutlined />}
                onClick={() => {
                  if (currentIndex === total - 1) {
                    handleSubmit();
                  } else {
                    setCurrentIndex(i => Math.min(total - 1, i + 1));
                  }
                }}
                disabled={!canGoNext()}
              >
                {currentIndex === total - 1 ? 'Завершить' : 'Далее'}
              </Button>
            </div>
          </>
        )}

        {completed && (
          <>
            <Title level={4} style={{ marginTop: 8 }}>
              Результат
            </Title>
            <div style={{ marginTop: 8 }}>
              <Text>
                Баллы: <b>{score ?? 0}</b>
              </Text>
              {interpretation && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f'
                    }}
                  >
                    <Text>{interpretation.text}</Text>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <Button type="primary" onClick={() => message.info('Модалка результатов будет добавлена следующим шагом (ResultsModal).')}>
                Смотреть результаты
              </Button>
              <Button icon={<ReloadOutlined />} onClick={restartTest} disabled={saving}>
                Пройти снова
              </Button>
              <Button onClick={() => navigate('/dashboard')} disabled={saving}>
                Вернуться в личный кабинет
              </Button>
            </div>

            {saving && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Сохраняю результат…</Text>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AdditionalTestPage;


