import React from 'react'
import Layout from '../../components/layout/Layout'
import { useTranslation } from 'react-i18next'
import TimelineGallery from '../../components/timelineGallery/TimelineGallery'

const VideosPage = () => {
  const { t } = useTranslation()

  return (
    <>
      <Layout title={t('videos_page.title', 'Videos')}>
        <TimelineGallery defaultOnlyVideos hideVideoCheckbox />
      </Layout>
    </>
  )
}

export default VideosPage
