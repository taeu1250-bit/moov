import { useState } from 'react'
import { Check, Plus, Minus, Trophy, UserRound } from 'lucide-react'
import { isTeamSport, shiftDay, sports, today, venues, kindLabel } from '../domain/model'
import type { Kind, Sport } from '../domain/model'
import { uid } from '../domain/matching'
import { SportMark } from '../ui/common'
import { useMoov, go } from '../ui/context'

function Stepper({
  label,
  value,
  min,
  max,
  change,
}: {
  label: string
  value: number
  min: number
  max: number
  change: (n: number) => void
}) {
  return (
    <div className="form-row">
      <span>{label}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={label + ' 줄이기'}
          disabled={value <= min}
          onClick={() => change(value - 1)}
        >
          <Minus size={16} />
        </button>
        <strong>{value}명</strong>
        <button
          type="button"
          aria-label={label + ' 늘리기'}
          disabled={value >= max}
          onClick={() => change(value + 1)}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
export function Create() {
  const { user, act, busy } = useMoov()
  const [kind, setKind] = useState<Kind>('pickup')
  const [sport, setSport] = useState<Sport>('풋살')
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [date, setDate] = useState(shiftDay(today(), 1))
  const [time, setTime] = useState('18:00')
  const [capacity, setCapacity] = useState(12)
  const [existing, setExisting] = useState(1)
  const [paid, setPaid] = useState(false)
  const [fee, setFee] = useState('')
  const [level, setLevel] = useState('누구나 환영')
  const [description, setDescription] = useState('')
  const friendly = kind === 'friendly'
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const id = uid()
    if (
      await act(
        {
          type: 'create',
          id,
          fields: {
            kind,
            sport,
            title,
            venue,
            start: new Date(date + 'T' + time + ':00+09:00').toISOString(),
            capacity,
            existing: friendly ? capacity : existing,
            fee: paid ? Number(fee) : 0,
            level,
            description,
          },
        },
        '모집글을 등록했어요.',
      )
    )
      go('match/' + id)
  }
  return (
    <div className="narrow">
      <h1>경기 모집하기</h1>
      <form className="stack" onSubmit={submit}>
        <section className="panel">
          <h2>모집 유형</h2>
          <div className="segmented">
            <button
              type="button"
              className={!friendly ? 'sel' : ''}
              onClick={() => setKind('pickup')}
            >
              <UserRound size={16} /> {kindLabel.pickup}
            </button>
            <button
              type="button"
              disabled={user.role !== 'leader'}
              className={friendly ? 'sel' : ''}
              onClick={() => {
                setKind('friendly')
                if (!isTeamSport(sport)) setSport('풋살')
              }}
            >
              <Trophy size={16} /> {kindLabel.friendly}
            </button>
          </div>
          <p className="hint">
            {user.role === 'student'
              ? '친선경기는 팀 대표 계정에서 개설할 수 있어요.'
              : friendly
                ? user.team + ' 이름으로 친선경기를 모집해요.'
                : '개인 참가자를 한 명씩 모집해요.'}
          </p>
        </section>
        <section className="panel">
          <h2>운동 종목</h2>
          <div className="sport-grid">
            {sports
              .filter((s) => !friendly || isTeamSport(s))
              .map((s) => (
                <button
                  type="button"
                  aria-pressed={sport === s}
                  key={s}
                  onClick={() => setSport(s)}
                >
                  <SportMark sport={s} />
                  {s}
                </button>
              ))}
          </div>
        </section>
        <section className="panel">
          <label>
            모집 제목 <small>{title.length} / 40</small>
            <input
              required
              maxLength={40}
              placeholder="예: 저녁 풋살 같이 하실 분"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
        </section>
        <section className="panel">
          <h2>일시 및 시간</h2>
          <div className="two">
            <label>
              날짜
              <input
                required
                type="date"
                min={today()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              시작 시간
              <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>
        </section>
        <section className="panel">
          <h2 id="venue-title">운동 장소</h2>
          <div className="venue-grid" role="radiogroup" aria-labelledby="venue-title">
            {venues.map((place) => (
              <label className="venue-option" key={place}>
                <input
                  type="radio"
                  name="venue"
                  required
                  value={place}
                  checked={venue === place}
                  onChange={() => setVenue(place)}
                />
                <span>{place}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>인원 및 참가비</h2>
          <Stepper
            label={friendly ? '우리 팀 인원' : '모집 정원'}
            value={capacity}
            min={2}
            max={30}
            change={(n) => {
              setCapacity(n)
              setExisting(Math.min(n, existing))
            }}
          />
          {!friendly && (
            <Stepper
              label="기존 참가자 (모집자 포함)"
              value={existing}
              min={1}
              max={capacity}
              change={setExisting}
            />
          )}
          <div className="chips">
            <button type="button" aria-pressed={!paid} onClick={() => setPaid(false)}>
              무료
            </button>
            <button type="button" aria-pressed={paid} onClick={() => setPaid(true)}>
              현장 분담금
            </button>
          </div>
          {paid && (
            <label>
              1인당 분담금 (원)
              <input
                required
                inputMode="numeric"
                type="number"
                min="1"
                max="1000000"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </label>
          )}
        </section>
        <details className="panel optional-fields">
          <summary>
            추가 안내 <small>선택</small>
          </summary>
          <h2>실력 레벨</h2>
          <div className="chips">
            {['누구나 환영', '초보~중급', '숙련자 위주'].map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={item === level}
                onClick={() => setLevel(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label>
            상세 안내 <small>선택 · {description.length}/500</small>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="준비물과 경기 방식을 알려주세요."
            />
          </label>
        </details>
        <button className="primary full" disabled={busy}>
          <Check size={17} /> 모집글 등록하기
        </button>
      </form>
    </div>
  )
}
