import React from 'react'
import { cn } from '../../lib/utils'

/* ─── Button ─────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}
export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 dark:focus-visible:ring-offset-gray-900 active:scale-[0.98]',
        {
          'bg-brand-600 text-white hover:bg-brand-500 shadow-sm hover:shadow-md': variant === 'primary',
          'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-750 dark:hover:border-gray-600': variant === 'secondary',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-500 shadow-sm': variant === 'danger',
          'text-xs px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-sm px-5 py-2.5': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ─── Card ───────────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200/60 shadow-card dark:bg-gray-900 dark:border-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── Badge ──────────────────────────────────────────── */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}
export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/* ─── Input ──────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}
export function Input({ label, className, ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
          'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500',
          'transition-all duration-150',
          className
        )}
        {...props}
      />
    </div>
  )
}

/* ─── Select ─────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}
export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
          'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100',
          'transition-all duration-150',
          className
        )}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/* ─── Textarea ───────────────────────────────────────── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>}
      <textarea
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
          'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500',
          'transition-all duration-150',
          className
        )}
        {...props}
      />
    </div>
  )
}

/* ─── Progress Bar ───────────────────────────────────── */
interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClass?: string
}
export function Progress({ value, max = 100, className, barClass }: ProgressProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={cn('h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', barClass || 'bg-brand-500')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ─── Modal / Dialog ─────────────────────────────────── */
interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}
export function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className={cn('relative bg-white dark:bg-gray-900 rounded-xl shadow-elevated border border-gray-200/60 dark:border-gray-800 max-h-[85vh] overflow-y-auto animate-scale-in', className)}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg', className)} />
}

/* ─── Empty State ────────────────────────────────────── */
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: React.ReactNode
}
export function StatCard({ label, value, sub, color = 'text-gray-900 dark:text-white', icon }: StatCardProps) {
  return (
    <Card className="p-5 hover:shadow-elevated transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{label}</p>
          <p className={cn('text-2xl font-bold font-mono tracking-tight', color)}>{value}</p>
          {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        {icon && <div className="text-gray-300 dark:text-gray-600">{icon}</div>}
      </div>
    </Card>
  )
}
