import { useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Coins,
  Flag,
  MapPin,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import {
  activeEntry,
  confirmed,
  dateKey,
  entriesFor,
  fmtDate,
  fmtTime,
  matchStatus,
  money,
  seats,
  statusLabel,
} from '../domain/model'
import type { Match } from '../domain/model'
import { Avatar, BackTitle, Tags } from '../ui/common'
import { useMoov, go } from '../ui/context'

export function Detail({ m, origin }: { m: Match; origin: string | null }) {
  const { data, user, act, busy } = useMoov()
  const host = data.users.find((u) => u.id === m.hostId)!
  const mine = m.hostId === user.id,
    team = m.kind === 'friendly'
  const entry = activeEntry(data, m, user.id)
  const state = matchStatus(data, m)
  const picked = confirmed(data, m)
  const count = seats(data, m)
  const entries = entriesFor(data, m)
  const locked = team && (user.role !== 'leader' || user.team === host.team)
  const latest = entries.find((e) => e.userId === user.id)
  const back =
    origin === 'hosted'
      ? 'activity?tab=hosted'
      : origin === 'activity'
        ? 'activity'
        : 'home?day=' + dateKey(m.start)
  return (
    <div className="narrow">
      <BackTitle title="경기 상세" back={back} />
      <div className="detail-summary">
        <Tags m={m} />
        <h1>{m.title}</h1>
        <span className="meta">
          <MapPin size={15} />
          {m.venue}
        </span>
        <div className="metrics">
          <div>
            <CalendarDays />
            <small>일시</small>
            <b>
              {fmtDate(m.start)} {fmtTime(m.start)}
            </b>
          </div>
          <div>
            <Coins />
            <small>1인 참가비</small>
            <b>{money(m.fee)}</b>
          </div>
        </div>
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>모집자</h2>
          {host.team && <span className="tag">{host.team}</span>}
        </div>
        <div className="person-line">
          <Avatar name={host.name} />
          <div>
            <strong>{host.name}</strong>
            <p>
              {host.dept} · {String(host.year).slice(-2)}학번
            </p>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>{team ? '상대팀 매칭' : '참가 현황'}</h2>
          <b className="accent">
            {team ? picked[0]?.team || '상대팀 모집 중' : count + ' / ' + m.capacity + '명'}
          </b>
        </div>
        {team ? (
          <p className="hint">
            홈팀 {host.team} · {m.existing}명 · 친선경기 상대 1팀
          </p>
        ) : (
          <>
            <progress value={count} max={m.capacity} />
            <div className="member-strip">
              <span className="member filled">{host.name.slice(-2)}</span>
              {m.existing > 1 && <span className="member">+{m.existing - 1}</span>}
              {picked.slice(0, 4).map((e) => (
                <span className="member filled" key={e.id}>
                  {data.users.find((u) => u.id === e.userId)?.name.slice(-2)}
                </span>
              ))}
              {count < m.capacity && (
                <span className="member empty-slot">+{m.capacity - count}</span>
              )}
            </div>
          </>
        )}
        <p className="sub-line">
          <UsersRound size={15} />
          승인 대기 {entries.filter((e) => e.status === 'pending').length}
          {team ? '팀' : '명'}
        </p>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>경기 안내</h2>
          <span className="tag">{m.level}</span>
        </div>
        <p className="description">{m.description || '별도로 등록된 안내가 없어요.'}</p>
      </section>
      {latest && !entry && !mine && (
        <p className="info-note">
          <ClipboardList size={17} />내 신청 상태 · {statusLabel[latest.status]}
        </p>
      )}
      <div className="action-bar">
        {mine ? (
          <button className="primary full" onClick={() => go('manage/' + m.id)}>
            신청자 관리 <ArrowRight size={18} />
          </button>
        ) : entry ? (
          <button
            className="secondary full"
            disabled={busy || state === '경기 시작'}
            onClick={() =>
              void act(
                { type: 'review', entryId: entry.id, decision: 'cancel' },
                '신청을 취소했어요.',
              )
            }
          >
            {statusLabel[entry.status]} · 신청 취소
          </button>
        ) : (
          <button
            className="primary full"
            disabled={locked || state !== '모집 중'}
            onClick={() => go('apply/' + m.id)}
          >
            {locked
              ? user.role === 'leader'
                ? '우리 팀 친선경기'
                : '팀 대표만 신청 가능'
              : state !== '모집 중'
                ? state
                : team
                  ? '친선경기 신청하기'
                  : '개인 참가 신청하기'}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

export function Apply({ m }: { m: Match }) {
  const { data, user, act, busy } = useMoov()
  const [note, setNote] = useState('')
  const [agree, setAgree] = useState(false)
  const team = m.kind === 'friendly'
  const eligible =
    m.hostId !== user.id &&
    !activeEntry(data, m, user.id) &&
    matchStatus(data, m) === '모집 중' &&
    (!team ||
      (user.role === 'leader' && user.team !== data.users.find((u) => u.id === m.hostId)?.team))
  return (
    <div className="narrow">
      <BackTitle title={team ? '친선경기 신청' : '개인 참가 신청'} back={'match/' + m.id} />
      <section className="panel">
        <Tags m={m} />
        <h2 className="large">{m.title}</h2>
        <p className="meta">
          <CalendarDays size={15} />
          {fmtDate(m.start)} {fmtTime(m.start)}
        </p>
        <p className="meta">
          <MapPin size={15} />
          {m.venue}
        </p>
      </section>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault()
          if (
            agree &&
            (await act(
              { type: 'apply', matchId: m.id, note },
              '신청했어요. 모집자 승인 대기 중이에요.',
            ))
          )
            go('match/' + m.id)
        }}
      >
        <section className="panel">
          <h2>{team ? '신청 팀' : '신청자 정보'}</h2>
          <div className="sample-profile">
            <Avatar name={user.name} />
            <div>
              <strong>{team ? user.team : user.name}</strong>
              <p>{team ? '팀 대표 ' + user.name : user.dept + ' · 본인 1명'}</p>
            </div>
          </div>
          <label>
            신청 한마디 <small>선택 · {note.length}/200</small>
            <textarea
              rows={3}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="모집자에게 전할 말을 남겨 주세요."
            />
          </label>
        </section>
        <section className="panel">
          <h2>
            <ShieldCheck size={18} /> 경기 매너
          </h2>
          <p className="hint">
            시작 10분 전까지 모여 주세요. 참여가 어려워지면 경기 시작 전에 신청을 취소해 주세요.
          </p>
          <label className="check">
            <input
              type="checkbox"
              required
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            경기 시간과 매너 수칙을 확인했어요.
          </label>
        </section>
        <div className="action-bar">
          <div className="row fee-line">
            <span>1인 현장 분담금</span>
            <b>{money(m.fee)}</b>
          </div>
          <button className="primary full" disabled={!eligible || !agree || busy}>
            {eligible ? (
              <>
                <Check size={17} />
                {team ? '팀으로 신청하기' : '1명 참가 신청하기'}
              </>
            ) : (
              '지금은 신청할 수 없어요'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export function Manage({ m }: { m: Match }) {
  const { data, user, act, busy } = useMoov()
  const [tab, setTab] = useState<'pending' | 'approved' | 'history'>('pending')
  if (user.id !== m.hostId)
    return (
      <div className="narrow">
        <BackTitle title="신청자 관리" back={'match/' + m.id} />
        <div className="panel">이 화면은 경기 모집자만 열 수 있어요.</div>
      </div>
    )
  const entries = entriesFor(data, m),
    team = m.kind === 'friendly'
  const groups = {
    pending: entries.filter((e) => e.status === 'pending'),
    approved: entries.filter((e) => e.status === 'approved'),
    history: entries.filter((e) => !['pending', 'approved'].includes(e.status)),
  }
  const remaining = m.capacity - seats(data, m)
  const opponent = confirmed(data, m)[0]?.team
  const isOver = Date.parse(m.start) <= Date.now()
  return (
    <div className="narrow">
      <BackTitle title="신청자 관리" back={'match/' + m.id} />
      <section className="panel">
        <Tags m={m} />
        <h2 className="large">{m.title}</h2>
        <p className="meta">
          <CalendarDays size={15} />
          {fmtDate(m.start)} {fmtTime(m.start)} · {m.venue}
        </p>
        <div className="manage-stat">
          <Flag size={17} />
          {team
            ? opponent
              ? opponent + ' 매칭 확정'
              : '상대팀 1팀 모집'
            : '확정 ' + seats(data, m) + ' / ' + m.capacity + '명 · 잔여 ' + remaining + '석'}
        </div>
      </section>
      <div className="segmented manage-tabs">
        {(['pending', 'approved', 'history'] as const).map((t, i) => (
          <button key={t} className={tab === t ? 'sel' : ''} onClick={() => setTab(t)}>
            {['승인 대기', '확정', '취소·거절'][i]} ({groups[t].length})
          </button>
        ))}
      </div>
      {tab === 'approved' && !team && (
        <div className="panel compact">
          <b>기존 참가자 {m.existing}명</b>
          <p className="hint">모집자를 포함해 개설할 때 등록된 인원이에요.</p>
        </div>
      )}
      {groups[tab].map((e) => {
        const applicant = data.users.find((u) => u.id === e.userId)!
        return (
          <section className="panel" key={e.id}>
            <div className="person-line">
              <Avatar name={applicant.name} />
              <div>
                <strong>{e.team || applicant.name}</strong>
                <p>
                  {e.team ? '대표 ' + applicant.name : '개인 1명'} · {statusLabel[e.status]}
                </p>
              </div>
            </div>
            {e.note && <p className="quote">{e.note}</p>}
            {tab === 'pending' && (
              <div className="action-pair">
                <button
                  className="secondary"
                  disabled={busy || isOver}
                  onClick={() =>
                    void act(
                      { type: 'review', entryId: e.id, decision: 'reject' },
                      '신청을 거절했어요.',
                    )
                  }
                >
                  거절
                </button>
                <button
                  className="primary"
                  disabled={busy || matchStatus(data, m) !== '모집 중'}
                  onClick={() =>
                    void act(
                      { type: 'review', entryId: e.id, decision: 'approve' },
                      team ? '상대팀 매칭을 확정했어요.' : '참가를 승인했어요.',
                    )
                  }
                >
                  승인
                </button>
              </div>
            )}
            {tab === 'approved' && (
              <button
                className="secondary"
                disabled={busy || isOver}
                onClick={() =>
                  void act(
                    { type: 'review', entryId: e.id, decision: 'cancel' },
                    '참가를 취소했어요.',
                  )
                }
              >
                참가 취소 처리
              </button>
            )}
          </section>
        )
      })}
      {!groups[tab].length && (
        <div className="empty">
          <ClipboardList />
          <strong>
            {tab === 'pending'
              ? '대기 중인 신청이 없어요'
              : tab === 'approved'
                ? '승인한 신청이 없어요'
                : '취소·거절·미선정 내역이 없어요'}
          </strong>
        </div>
      )}
    </div>
  )
}
