'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  FilterX,
  ImagePlus,
  Laptop,
  MapPin,
  PackageSearch,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Watch,
  X,
} from 'lucide-react'

type Status = 'Lost' | 'Found'
type Category = 'Electronics' | 'Stationery' | 'Accessories' | 'Clothing' | 'Others'
type BoardItem = {
  id: string
  name: string
  status: Status
  category: Category
  location: string
  date: string
  description: string
  email: string
  image: string
}

const STORAGE_KEY = 'campus-found-items-v1'
const categories: Category[] = ['Electronics', 'Stationery', 'Accessories', 'Clothing', 'Others']
const initialItems: BoardItem[] = [
  {
    id: 'sample-1', name: 'Silver MacBook charger', status: 'Found', category: 'Electronics', location: 'North Library · 2nd floor', date: '2026-10-21',
    description: 'USB-C charger left plugged in by the window seats. Picked it up so it stays safe.', email: 'maya.chen@campus.edu',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'sample-2', name: 'Blue canvas tote bag', status: 'Lost', category: 'Accessories', location: 'Student Union · Garden entrance', date: '2026-10-20',
    description: 'Navy tote with a small embroidered sun. Has my sketchbook and keys inside.', email: 'jordan.lee@campus.edu',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'sample-3', name: 'Physics notebook', status: 'Found', category: 'Stationery', location: 'Science Hall · Room 204', date: '2026-10-19',
    description: 'Black spiral notebook with PHY 201 written on the inside cover.', email: 'alex.rivera@campus.edu',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'sample-4', name: 'Green knit cardigan', status: 'Lost', category: 'Clothing', location: 'Arts Building · Studio B', date: '2026-10-18',
    description: 'Left on the back of a chair after the afternoon ceramics class. Really hoping to get it back!', email: 'sam.patel@campus.edu',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'sample-5', name: 'Silver hoop earrings', status: 'Found', category: 'Accessories', location: 'Campus café · Patio table', date: '2026-10-17',
    description: 'A pair of small silver hoops found near the outdoor tables at lunchtime.', email: 'riley.morgan@campus.edu',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'sample-6', name: 'Wireless headphones', status: 'Lost', category: 'Electronics', location: 'West Gym · Locker room', date: '2026-10-16',
    description: 'Black over-ear headphones in a soft case. Last seen after my 4 pm workout.', email: 'noah.kim@campus.edu',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  },
]

function categoryIcon(category: Category) {
  if (category === 'Electronics') return Laptop
  if (category === 'Stationery') return BookOpen
  if (category === 'Accessories') return Watch
  if (category === 'Clothing') return Shirt
  return PackageSearch
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function gmailComposeUrl(item: BoardItem) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: item.email,
    su: `Regarding your ${item.status.toLowerCase()} item: ${item.name}`,
    body: `Hello,\n\nI’m reaching out about your ${item.status.toLowerCase()} item, “${item.name},” posted on the Campus Finds board. ${item.status === 'Lost' ? 'I may have information that could help you locate it. Please let me know when you have a chance.' : 'Could you please share the best way to verify and collect it?'}\n\nThank you,\n[Your name]`,
  })

  return `https://mail.google.com/mail/?${params.toString()}`
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not process this image. Try another file.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.78)
}

export function CampusBoard() {
  const [items, setItems] = useState<BoardItem[]>(initialItems)
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [formError, setFormError] = useState('')
  const [posted, setPosted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) setItems(parsed as BoardItem[])
      }
    } catch {
      // Keep the sample board available when browser storage is unavailable.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      setFormError('Your browser storage is full. Try a smaller image before posting.')
    }
  }, [items, hydrated])

  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
        setFormError('')
        setPosted(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items
      .filter((item) => statusFilter === 'All status' || item.status === statusFilter)
      .filter((item) => categoryFilter === 'All categories' || item.category === categoryFilter)
      .filter((item) => !normalizedQuery || [item.name, item.location, item.description, item.category].some((value) => value.toLowerCase().includes(normalizedQuery)))
      .sort((a, b) => sortOrder === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  }, [items, query, statusFilter, categoryFilter, sortOrder])

  const lostCount = items.filter((item) => item.status === 'Lost').length
  const foundCount = items.filter((item) => item.status === 'Found').length

  async function handleImageChange(file?: File) {
    if (!file) return
    setFormError('')
    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Choose an image smaller than 10 MB.')
      return
    }
    try {
      setImagePreview(await compressImage(file))
    } catch {
      setFormError('We couldn’t read that image. Try another file.')
    }
  }

  function openModal() {
    setFormError('')
    setPosted(false)
    setImagePreview('')
    setIsModalOpen(true)
  }

  function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const formData = new FormData(event.currentTarget)
    const nextItem: BoardItem = {
      id: crypto.randomUUID(),
      name: String(formData.get('name') || '').trim(),
      status: String(formData.get('status')) as Status,
      category: String(formData.get('category')) as Category,
      location: String(formData.get('location') || '').trim(),
      date: String(formData.get('date')),
      description: String(formData.get('description') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      image: imagePreview || '/placeholder.svg?height=560&width=800',
    }
    if (nextItem.name.length > 90 || nextItem.location.length > 120 || nextItem.description.length > 600) {
      setFormError('Please shorten the name, location, or description and try again.')
      return
    }
    const nextItems = [nextItem, ...items]
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
      setItems(nextItems)
      setPosted(true)
      window.setTimeout(() => {
        setIsModalOpen(false)
        setPosted(false)
      }, 900)
    } catch {
      setFormError('This post is too large for browser storage. Try a smaller image.')
    }
  }

  function closeModal() {
    setIsModalOpen(false)
    setFormError('')
    setPosted(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#202d28]">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex items-center gap-3" aria-label="Campus Finds home">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#174c3c] text-white shadow-sm"><PackageSearch className="size-5" /></span>
          <span className="text-[17px] font-semibold tracking-[-0.04em]">campus<span className="text-[#5f9e7d]">finds</span></span>
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-[#e4e9e3] bg-white px-3.5 py-2 text-xs font-medium text-[#597067] sm:flex"><span className="size-2 rounded-full bg-[#65a77f]" /> Your campus community</span>
          <button type="button" onClick={openModal} className="inline-flex items-center gap-2 rounded-xl bg-[#174c3c] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(23,76,60,.14)] transition hover:bg-[#103d30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174c3c]"><Plus className="size-4" /> <span className="hidden sm:inline">Post an item</span><span className="sm:hidden">Post</span></button>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1440px] px-5 pt-4 sm:px-8 lg:px-12 lg:pt-8">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-[#173f34] px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-[54px]">
          <div aria-hidden="true" className="absolute -right-16 -top-32 -z-10 size-[390px] rounded-full border border-white/[0.08] sm:right-8 sm:top-[-250px] sm:size-[620px]" />
          <div aria-hidden="true" className="absolute -right-3 -top-20 -z-10 size-[260px] rounded-full border border-white/[0.07] sm:right-24 sm:top-[-190px] sm:size-[500px]" />
          <div aria-hidden="true" className="absolute bottom-[-150px] right-[15%] -z-10 size-[280px] rounded-full bg-[#8cbb87]/10 blur-3xl" />
          <div className="relative max-w-[750px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium tracking-wide text-[#d4eadb]"><Sparkles className="size-3.5" /> THE CAMPUS COMMUNITY BOARD</div>
            <h1 className="max-w-[660px] text-[38px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-5xl lg:text-[60px]">Lost something?<br className="hidden sm:block" /> <span className="text-[#b6d69f]">Let&apos;s bring it home.</span></h1>
            <p className="mt-4 max-w-[510px] text-sm leading-6 text-[#d2e0d8] sm:text-base sm:leading-7">A little help goes a long way. Browse recent finds or let your campus know what you&apos;re looking for.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex min-w-[140px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#f5d8dc]/15 text-[#ffc9d0]"><Search className="size-[17px]" /></span><span><strong className="block text-lg leading-5">{lostCount}</strong><span className="text-xs text-[#c6d7ce]">items to find</span></span></div>
              <div className="flex min-w-[140px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#b6d69f]/15 text-[#c9ebb3]"><Check className="size-[17px]" /></span><span><strong className="block text-lg leading-5">{foundCount}</strong><span className="text-xs text-[#c6d7ce]">found on campus</span></span></div>
            </div>
          </div>
          <div className="absolute bottom-7 right-10 hidden size-28 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#c5dfbe] lg:flex"><div className="flex size-[78px] items-center justify-center rounded-full border border-white/10"><PackageSearch className="size-8 stroke-[1.25]" /></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-9 sm:px-8 sm:pt-12 lg:px-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78a185]">A little campus kindness</div><h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-[30px]">The latest on campus</h2><p className="mt-1.5 text-sm text-[#7c8983]">Every post is one step closer to getting something back.</p></div>
          <button type="button" onClick={openModal} className="hidden items-center gap-2 self-start rounded-xl border border-[#dce4dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#315e4a] transition hover:border-[#a9c1af] hover:bg-[#f3f8f2] md:inline-flex"><Plus className="size-4" /> Share a lost or found item</button>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-[#e7ebe6] bg-white p-3 shadow-[0_4px_22px_rgba(33,51,43,.035)] md:grid-cols-[minmax(220px,1fr)_170px_190px_150px] md:items-center md:p-3.5">
          <label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-[#9aa8a0]" /><span className="sr-only">Search items</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items, places, details..." className="h-11 w-full rounded-xl border border-[#e8ede8] bg-[#fbfcfa] pl-10 pr-9 text-sm text-[#25342d] outline-none transition placeholder:text-[#9aa59f] focus:border-[#9bbca2] focus:ring-2 focus:ring-[#e8f1e8]" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9890] hover:text-[#24352d]"><X className="size-4" /></button>}</label>
          <label className="relative"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#e8ede8] bg-[#fbfcfa] px-3.5 pr-9 text-sm text-[#45564d] outline-none focus:border-[#9bbca2] focus:ring-2 focus:ring-[#e8f1e8]"><option>All status</option><option>Lost</option><option>Found</option></select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#829087]">⌄</span></label>
          <label className="relative"><span className="sr-only">Filter by category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#e8ede8] bg-[#fbfcfa] px-3.5 pr-9 text-sm text-[#45564d] outline-none focus:border-[#9bbca2] focus:ring-2 focus:ring-[#e8f1e8]"><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#829087]">⌄</span></label>
          <button type="button" onClick={() => setSortOrder((current) => current === 'newest' ? 'oldest' : 'newest')} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e8ede8] bg-[#fbfcfa] px-3.5 text-sm font-medium text-[#45564d] transition hover:bg-[#f3f7f2]"><ArrowDownWideNarrow className="size-4 text-[#7b9282]" /> {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</button>
        </div>

        <div className="mb-4 flex items-center justify-between"><p className="text-sm text-[#7b8981]">Showing <span className="font-semibold text-[#33453b]">{visibleItems.length}</span> {visibleItems.length === 1 ? 'item' : 'items'}</p>{(query || statusFilter !== 'All status' || categoryFilter !== 'All categories') && <button type="button" onClick={() => { setQuery(''); setStatusFilter('All status'); setCategoryFilter('All categories') }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#527a61] hover:text-[#174c3c]"><FilterX className="size-3.5" /> Clear filters</button>}</div>

        {visibleItems.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">{visibleItems.map((item) => {
          const Icon = categoryIcon(item.category)
          return <article key={item.id} className="group overflow-hidden rounded-[20px] border border-[#e7ebe6] bg-white shadow-[0_5px_22px_rgba(33,51,43,.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(33,51,43,.10)]">
            <div className="relative aspect-[1.75/1] overflow-hidden bg-[#edf1eb]"><img src={item.image} alt={item.name} onError={(event) => { if (!event.currentTarget.src.includes('/placeholder.svg')) event.currentTarget.src = '/placeholder.svg?height=560&width=800' }} className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" /><span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide shadow-sm ${item.status === 'Lost' ? 'bg-[#fff0f1] text-[#bd4d5c]' : 'bg-[#ecf8ef] text-[#388357]'}`}><span className={`size-1.5 rounded-full ${item.status === 'Lost' ? 'bg-[#d66170]' : 'bg-[#53a06c]'}`} />{item.status}</span><span className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#59685e] shadow-sm backdrop-blur-sm">{item.category}</span></div>
            <div className="p-5 sm:p-[21px]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-[17px] font-semibold tracking-[-0.035em] text-[#26362e]">{item.name}</h3><div className="mt-2 flex items-center gap-1.5 text-xs text-[#7c8982]"><MapPin className="size-3.5 shrink-0 text-[#86a08c]" /><span className="truncate">{item.location}</span></div></div><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f6f1] text-[#75927c]"><Icon className="size-[17px]" /></span></div><p className="mt-4 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#78857e]">{item.description}</p><div className="mt-4 flex items-center justify-between border-t border-[#eef1ed] pt-4"><span className="inline-flex items-center gap-1.5 text-xs text-[#929d96]"><CalendarDays className="size-3.5" />{formatDate(item.date)}</span><a href={gmailComposeUrl(item)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#397354] transition hover:text-[#174c3c]">Get in touch <ArrowUpRight className="size-3.5" /></a></div></div>
          </article>
        })}</div> : <div className="flex min-h-[290px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#dbe4dc] bg-white px-5 text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#f0f5ef] text-[#6f9278]"><PackageSearch className="size-6" /></span><h3 className="text-lg font-semibold tracking-[-0.03em]">No items found</h3><p className="mt-1 max-w-sm text-sm leading-6 text-[#7d8a82]">Try a different search or clear your filters. If it&apos;s missing, help us get the word out.</p><button onClick={() => { setQuery(''); setStatusFilter('All status'); setCategoryFilter('All categories') }} className="mt-4 text-sm font-semibold text-[#3b7656] hover:text-[#174c3c]">Clear all filters</button></div>}

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#e4ebe3] bg-[#eff5ed] px-5 py-5 sm:flex-row sm:items-center sm:px-7"><div className="flex items-start gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#5f8d6c]"><Sparkles className="size-4" /></span><div><p className="text-sm font-semibold text-[#385141]">Found something? Be someone&apos;s favorite person today.</p><p className="mt-1 text-xs leading-5 text-[#718478]">A quick post could make someone&apos;s whole week.</p></div></div><button onClick={openModal} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#174c3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103d30]"><Plus className="size-4" /> Post an item</button></div>
      </section>

      <footer className="border-t border-[#e8ece7] bg-white/60"><div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 text-xs text-[#8a968f] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>Made for campus, powered by a little kindness.</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" /> Posts stay on this device</span></div></footer>

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#14261f]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}><section role="dialog" aria-modal="true" aria-labelledby="post-title" onKeyDown={(event) => { if (event.key === 'Escape') closeModal() }} className="max-h-[94vh] w-full max-w-[600px] overflow-y-auto rounded-t-[26px] bg-white shadow-2xl sm:rounded-[26px]"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#edf0ec] bg-white/95 px-5 py-4 backdrop-blur sm:px-7"><div><h2 id="post-title" className="text-xl font-semibold tracking-[-0.04em] text-[#26362e]">Share with your campus</h2><p className="mt-1 text-xs text-[#87938c]">The more details, the easier it is to reunite.</p></div><button type="button" aria-label="Close form" onClick={closeModal} className="flex size-9 items-center justify-center rounded-xl border border-[#e8ede8] text-[#68786e] transition hover:bg-[#f5f8f4]"><X className="size-4" /></button></div>
          {posted ? <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#edf8ef] text-[#398658]"><Check className="size-7" /></span><h3 className="text-xl font-semibold tracking-[-0.03em]">You&apos;re a campus hero.</h3><p className="mt-2 text-sm text-[#7b8981]">Your post is now on the board.</p></div> : <form onSubmit={submitItem} className="flex flex-col gap-4 px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Item name<input name="name" required maxLength={90} placeholder="e.g. Blue water bottle" className="h-11 rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 text-sm font-normal text-[#26362e] outline-none placeholder:text-[#a2aca5] focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]" /></label><label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Status<select name="status" className="h-11 rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 text-sm font-normal text-[#26362e] outline-none focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]"><option>Lost</option><option>Found</option></select></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Category<select name="category" className="h-11 rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 text-sm font-normal text-[#26362e] outline-none focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Date<input name="date" type="date" required max="9999-12-31" defaultValue={new Date().toISOString().slice(0, 10)} className="h-11 rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 text-sm font-normal text-[#26362e] outline-none focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]" /></label></div>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Campus location<input name="location" required maxLength={120} placeholder="Building, room, or nearby landmark" className="h-11 rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 text-sm font-normal text-[#26362e] outline-none placeholder:text-[#a2aca5] focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]" /></label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Description<textarea name="description" required maxLength={600} rows={3} placeholder="Add a few helpful details..." className="resize-y rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 py-3 text-sm font-normal leading-5 text-[#26362e] outline-none placeholder:text-[#a2aca5] focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]" /></label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#526158]">Contact email<input name="email" type="email" required maxLength={254} placeholder="you@campus.edu" className="h-11 rounded-xl border border-[#e1e8e1] bg-[#fbfcfa] px-3.5 text-sm font-normal text-[#26362e] outline-none placeholder:text-[#a2aca5] focus:border-[#96b79d] focus:ring-2 focus:ring-[#e8f1e8]" /></label>
            <div><span className="mb-1.5 block text-xs font-semibold text-[#526158]">Add a photo <span className="font-normal text-[#9aa59e]">(optional)</span></span><input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => handleImageChange(event.target.files?.[0])} />{imagePreview ? <div className="relative h-36 overflow-hidden rounded-xl border border-[#e1e8e1] bg-[#f7f8f4]"><img src={imagePreview} alt="Preview of selected item" className="size-full object-cover" /><button type="button" onClick={() => { setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = '' }} aria-label="Remove selected image" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-[#516157] shadow"><X className="size-4" /></button></div> : <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd9cd] bg-[#f8faf7] px-4 py-4 text-sm font-medium text-[#688173] transition hover:border-[#8cab91] hover:bg-[#f1f7f0]"><ImagePlus className="size-4" /> Choose an image <span className="text-xs font-normal text-[#9ba69e]">up to 10 MB</span></button>}</div>
            {formError && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-xs font-medium text-[#b34754]">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-[#edf0ec] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#64746a] transition hover:bg-[#f5f8f4]">Cancel</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#174c3c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103d30]"><Plus className="size-4" /> Publish item</button></div>
          </form>}
        </section></div>}
    </main>
  )
}
