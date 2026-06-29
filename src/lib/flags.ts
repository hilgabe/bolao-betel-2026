const teamCountryCodes: Record<string, string> = {
  ALG: 'DZ',
  ARG: 'AR',
  AUS: 'AU',
  AUT: 'AT',
  BEL: 'BE',
  BIH: 'BA',
  BRA: 'BR',
  CAN: 'CA',
  CIV: 'CI',
  COD: 'CD',
  COL: 'CO',
  CPV: 'CV',
  CRO: 'HR',
  ECU: 'EC',
  EGY: 'EG',
  ENG: 'GB',
  ESP: 'ES',
  FRA: 'FR',
  GER: 'DE',
  GHA: 'GH',
  JPN: 'JP',
  MAR: 'MA',
  MEX: 'MX',
  NED: 'NL',
  NOR: 'NO',
  PAR: 'PY',
  POR: 'PT',
  RSA: 'ZA',
  SEN: 'SN',
  SUI: 'CH',
  SWE: 'SE',
  USA: 'US',
}

export function countryFlag(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

export function getTeamFlag(teamCode: string, fallback = '') {
  const countryCode = teamCountryCodes[teamCode.toUpperCase()]
  if (countryCode) {
    return countryFlag(countryCode)
  }

  return fallback
}

export function getTeamCountryCode(teamCode: string) {
  return teamCountryCodes[teamCode.toUpperCase()] || ''
}
