import { useState, useEffect } from 'react'

interface ContentItem {
  id: string
  key: string
  title: string
  subtitle?: string
  content?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ContactItem {
  id: string
  type: string
  label: string
  value: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ContentData {
  contents: {
    benefits?: ContentItem[]
    contact?: ContentItem[]
    [key: string]: ContentItem | ContentItem[] | undefined
  }
  contacts: ContactItem[]
}

export function useContent() {
  const [data, setData] = useState<ContentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/public/content')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Gagal mengambil data')
      }
    } catch (error) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const getBenefits = () => {
    return data?.contents?.benefits || []
  }

  const getContactInfo = () => {
    return data?.contacts || []
  }

  const getContactByType = (type: string) => {
    return data?.contacts?.find(contact => contact.type === type)
  }

  const getContentByKey = (key: string) => {
    const content = data?.contents?.[key]
    return content && typeof content === 'object' && !Array.isArray(content) ? content as ContentItem : null
  }

  return {
    data,
    isLoading,
    error,
    getBenefits,
    getContactInfo,
    getContactByType,
    getContentByKey,
    refetch: fetchContent
  }
}