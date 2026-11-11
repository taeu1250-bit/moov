import { useState } from 'react'
import { ArrowRight, Check, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react'
import { schoolEmail } from '../domain/matching'
import { Wordmark } from '../ui/common'
import { go, useMoov } from '../ui/context'

export function Auth() {
  const { services, run, busy } = useMoov()
  const [mode, setMode] = useState<'quick' | 'verify'>('quick')
  const [mail, setMail] = useState('demo_student')
  const [verified, setVerified] = useState(false)
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')
  const email = mail.trim() + '@yonsei.ac.kr'
  async function start() {
    if (mode === 'verify' && !verified) {
      setError('시연 인증을 먼저 완료해 주세요.')
      return
    }
    const ok = await run(() =>
      mode === 'quick'
        ? services.session.select('min')
        : services.session.create(name, year, email),
    )
    if (ok) go('home')
  }
  return (
    <main className="auth-wrap">
      <div className="auth-brand">
        <div className="brand-center">
          <Wordmark />
          <span>MOVE TOGETHER</span>
        </div>
      </div>
      <section className="auth-form">
        <div className="campus-line">
          <GraduationCap size={18} /> 연세대학교 미래캠퍼스
        </div>
        <h1>함께할 운동을 찾아요</h1>
        <div className="segmented">
          <button
            className={mode === 'quick' ? 'sel' : ''}
            onClick={() => {
              setMode('quick')
              setError('')
            }}
          >
            바로 시작
          </button>
          <button
            className={mode === 'verify' ? 'sel' : ''}
            onClick={() => {
              setMode('verify')
              setError('')
            }}
          >
            학교 이메일 시연 인증
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void start()
          }}
        >
          {mode === 'quick' ? (
            <div className="sample-profile">
              <div className="profile-icon">
                <UsersRound />
              </div>
              <div>
                <strong>
                  김민서 <small>일반 학생</small>
                </strong>
                <p>소프트웨어학부 · 24학번</p>
              </div>
            </div>
          ) : (
            <>
              <label>
                시연용 학교 이메일
                <div className="email-field">
                  <input
                    aria-label="학교 이메일 아이디"
                    autoCapitalize="none"
                    autoComplete="off"
                    value={mail}
                    onChange={(e) => {
                      setMail(e.target.value)
                      setVerified(false)
                      setError('')
                    }}
                  />
                  <span>@yonsei.ac.kr</span>
                </div>
              </label>
              <button
                type="button"
                className="secondary full"
                onClick={() => {
                  const valid = schoolEmail(email)
                  setVerified(valid)
                  setError(valid ? '' : '학교 이메일 아이디 형식을 확인해 주세요.')
                }}
              >
                {verified ? (
                  <>
                    <Check size={16} /> 시연 인증 완료
                  </>
                ) : (
                  '시연 인증하기'
                )}
              </button>
              <div className="two">
                <label>
                  시연 닉네임
                  <input
                    placeholder="예: 매지러너"
                    maxLength={12}
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  입학연도
                  <select value={year} onChange={(e) => setYear(+e.target.value)}>
                    {Array.from(
                      { length: new Date().getFullYear() - 1999 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((y) => (
                      <option value={y} key={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button className="primary full" disabled={busy}>
            {mode === 'quick' ? '시연 계정으로 바로 시작' : '프로필 만들고 시작'}
            <ArrowRight size={19} />
          </button>
        </form>
        <div className="info-note">
          <ShieldCheck size={18} />
          <span>
            수업 시연용 앱이에요. 이메일을 발송하지 않으며, 시연 데이터는 이 브라우저에 저장돼요.
          </span>
        </div>
      </section>
    </main>
  )
}
