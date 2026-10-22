import Bestselling from '@/components/home/Bestselling'
import Browse from '@/components/home/Browse'
import Explore from '@/components/home/Explore'
import Flash from '@/components/home/Flash'
import Hero from '@/components/home/Hero'
import Speaker from '@/components/home/Speaker'
import Service from '@/components/Service'
import React from 'react'

const page = () => {
  return (
    <div className='relative w-full'>
      <Hero />
      <Flash />
      <Browse />
      <Bestselling />
      <Speaker />
      <Explore />
      <Service />
    </div>
  )
}

export default page