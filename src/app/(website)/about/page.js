import Achivement from '@/components/about/Achivement'
import Management from '@/components/about/Management'
import Service from '@/components/Service'
import Story from '@/components/about/Story'
import React from 'react'

const page = () => {
  return (
    <div>
        <Story />
        <Achivement />
        <Management />
        <Service />
    </div>
  )
}

export default page