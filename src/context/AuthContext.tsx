import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, db, firebaseConfigured } from '../lib/firebase'
import { authEmailFromParticipantId, participantIdFromName } from '../lib/participants'
import type { AppUser } from '../types'
import { AuthContext } from './auth'

const participantStorageKey = 'bolao-betel-selected-participant'

function getFirebaseErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''
}

function readStoredParticipant() {
  const raw = window.localStorage.getItem(participantStorageKey)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as { id: string; nome: string }
  } catch {
    window.localStorage.removeItem(participantStorageKey)
    return null
  }
}

function storeParticipant(participant: { id: string; nome: string }) {
  window.localStorage.setItem(participantStorageKey, JSON.stringify(participant))
}

function clearStoredParticipant() {
  window.localStorage.removeItem(participantStorageKey)
}

function profileFromUser(user: User, participant?: { id: string; nome: string }): AppUser {
  return {
    uid: participant?.id || user.uid,
    nome: participant?.nome || user.displayName || 'Participante',
    email: participant ? authEmailFromParticipantId(participant.id) : user.email || '',
    role: 'user',
    totalPontos: 0,
  }
}

async function upsertParticipantProfile(user: User, participant: { id: string; nome: string }) {
  if (!db) {
    return profileFromUser(user, participant)
  }

  const ref = doc(db, 'users', participant.id)
  const snapshot = await getDoc(ref)

  if (snapshot.exists()) {
    const existing = snapshot.data() as Partial<AppUser>
    await setDoc(
      ref,
      {
        uid: participant.id,
        nome: participant.nome,
        email: authEmailFromParticipantId(participant.id),
        role: existing.role || 'user',
        totalPontos: Number(existing.totalPontos || 0),
        authUid: user.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return {
      ...profileFromUser(user, participant),
      ...existing,
      uid: participant.id,
      nome: participant.nome,
      email: authEmailFromParticipantId(participant.id),
      totalPontos: Number(existing.totalPontos || 0),
    } as AppUser
  }

  const profile = profileFromUser(user, participant)
  await setDoc(ref, {
    ...profile,
    authUid: user.uid,
    createdAt: serverTimestamp(),
  })

  return profile
}

async function loadProfile(user: User) {
  const storedParticipant = readStoredParticipant()
  if (!storedParticipant) {
    return profileFromUser(user)
  }

  if (!db) {
    return profileFromUser(user, storedParticipant)
  }

  const ref = doc(db, 'users', storedParticipant.id)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) {
    return {
      ...profileFromUser(user, storedParticipant),
      ...snapshot.data(),
      uid: storedParticipant.id,
    } as AppUser
  }

  return upsertParticipantProfile(user, storedParticipant)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      loadProfile(user)
        .then(setProfile)
        .finally(() => setLoading(false))
    })
  }, [])

  const loginWithName = useCallback(async (nome: string, senha: string) => {
    if (!auth || !db) {
      throw new Error('Firebase não configurado.')
    }

    const participantName = nome.trim()
    const password = senha.trim()

    if (!participantName) {
      throw new Error('Informe seu nome.')
    }

    if (password.length < 6) {
      throw new Error('Use uma senha simples com pelo menos 6 caracteres.')
    }

    const participant = {
      id: participantIdFromName(participantName),
      nome: participantName,
    }
    const email = authEmailFromParticipantId(participant.id)

    let credential
    try {
      credential = await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      const code = getFirebaseErrorCode(error)
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        try {
          credential = await createUserWithEmailAndPassword(auth, email, password)
        } catch (createError) {
          const createCode = getFirebaseErrorCode(createError)
          if (createCode === 'auth/email-already-in-use') {
            throw new Error('Senha incorreta para esse nome.')
          }
          throw createError
        }
      } else if (code === 'auth/wrong-password') {
        throw new Error('Senha incorreta para esse nome.')
      } else {
        throw error
      }
    }

    await updateProfile(credential.user, { displayName: participant.nome })
    storeParticipant(participant)
    const updatedProfile = await upsertParticipantProfile(credential.user, participant)
    setFirebaseUser(credential.user)
    setProfile(updatedProfile)
  }, [])

  const logout = useCallback(async () => {
    clearStoredParticipant()
    if (auth) {
      await signOut(auth)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) {
      setProfile(null)
      return
    }
    setProfile(await loadProfile(firebaseUser))
  }, [firebaseUser])

  const value = useMemo(
    () => ({
      firebaseReady: firebaseConfigured,
      firebaseUser,
      profile,
      loading,
      loginWithName,
      logout,
      refreshProfile,
    }),
    [firebaseUser, loading, loginWithName, logout, profile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
