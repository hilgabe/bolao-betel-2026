import { getTeamCountryCode } from '../lib/flags'

export function TeamLabel({
  team,
  fallbackFlag = '',
  size = 'md',
}: {
  team: string
  fallbackFlag?: string
  size?: 'md' | 'lg'
}) {
  const countryCode = getTeamCountryCode(team)
  const flagClass = size === 'lg' ? 'h-6 w-8' : 'h-5 w-7'
  const textClass = size === 'lg' ? 'text-3xl' : 'text-xl'

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {countryCode ? (
        <img
          src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
          srcSet={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png 1x, https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
          alt=""
          className={`${flagClass} rounded-sm object-cover shadow-sm`}
          loading="lazy"
        />
      ) : fallbackFlag ? (
        <span aria-hidden="true">{fallbackFlag}</span>
      ) : null}
      <span className={`font-black text-slate-950 ${textClass}`}>{team}</span>
    </span>
  )
}
