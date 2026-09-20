import { gql, useQuery, useLazyQuery } from '@apollo/client'
import React, { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import Layout from '../../components/layout/Layout'
import PresentView from '../../components/photoGallery/presentView/PresentView'
import { MediaGalleryFields } from '../../components/photoGallery/__generated__/MediaGalleryFields'
import { mediaGeoJson } from './__generated__/mediaGeoJson'
import {
  placePageQueryMedia,
  placePageQueryMediaVariables,
} from './__generated__/placePageQueryMedia'
import { getCachedReverseGeocode, resolveReverseGeocodeAsync, LocationInfo } from './reverseGeocode'

const PageContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 120px);
  padding: 0 0 60px 0;
`

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`

const PageTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MainHeading = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (prefers-color-scheme: dark) {
    color: #f9fafb;
  }
`

const Subtitle = styled.div`
  font-size: 13.5px;
  color: #6b7280;

  @media (prefers-color-scheme: dark) {
    color: #9ca3af;
  }
`

const SearchInputWrapper = styled.div`
  position: relative;
  width: 280px;

  @media (max-width: 640px) {
    width: 100%;
  }
`

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 16px 0 38px;
  border-radius: 12px;
  border: 1px solid rgba(156, 163, 175, 0.4);
  background: rgba(255, 255, 255, 0.8);
  font-size: 13.5px;
  color: #111827;
  outline: none;
  transition: all 180ms ease;

  &:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
  }

  @media (prefers-color-scheme: dark) {
    background: #1e1e24;
    border-color: rgba(255, 255, 255, 0.12);
    color: #f3f4f6;

    &:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
    }
  }
`

const SearchIcon = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
`

const CityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
`

const CityCard = styled.div`
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease, border-color 200ms ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    border-color: #0284c7;
  }

  @media (prefers-color-scheme: dark) {
    background: #18181b;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

    &:hover {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
      border-color: #38bdf8;
    }
  }
`

const CoverPhotoWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 180px;
  background: #27272a;
  overflow: hidden;
`

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;

  ${CityCard}:hover & {
    transform: scale(1.05);
  }
`

const CountBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const CardInfo = styled.div`
  padding: 14px 16px;
`

const CityName = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (prefers-color-scheme: dark) {
    color: #f9fafb;
  }
`

const RegionCountry = styled.div`
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (prefers-color-scheme: dark) {
    color: #9ca3af;
  }
`

// Detail View Styles
const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`

const BackButton = styled.button`
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #111827;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 150ms ease;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: #f3f4f6;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
`

const MediaGalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
`

const MediaCard = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: #27272a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 180ms ease, box-shadow 180ms ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    border-color: #00d2ff;
  }
`

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const MAPBOX_DATA_QUERY = gql`
  query mediaGeoJson {
    myMediaGeoJson
  }
`

const QUERY_MEDIA = gql`
  query placePageQueryMedia($mediaIDs: [ID!]!) {
    mediaList(ids: $mediaIDs) {
      id
      title
      blurhash
      thumbnail {
        url
        width
        height
      }
      highRes {
        url
        width
        height
      }
      videoWeb {
        url
        width
        height
      }
      type
    }
  }
`

interface CityCluster {
  id: string
  name: string
  region: string
  country: string
  coverUrl: string
  photoCount: number
  mediaIds: string[]
}

const PlacesPage = () => {
  const { t } = useTranslation()
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedCity, setSelectedCity] = useState<CityCluster | null>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null)
  const [detailedMedia, setDetailedMedia] = useState<MediaGalleryFields[]>([])

  const { data: geoData, loading: geoLoading } = useQuery<mediaGeoJson>(MAPBOX_DATA_QUERY, {
    fetchPolicy: 'cache-first',
  })

  const [loadMedia, { loading: mediaLoading }] = useLazyQuery<
    placePageQueryMedia,
    placePageQueryMediaVariables
  >(QUERY_MEDIA)

  // Aggregate GeoJSON points into Cities using Reverse Geocoding
  const cityClusters = useMemo<CityCluster[]>(() => {
    const rawFeatures = (geoData?.myMediaGeoJson as any)?.features || []
    const groups: { [key: string]: CityCluster } = {}

    for (const feat of rawFeatures) {
      const coords = feat.geometry?.coordinates
      if (!coords || coords.length !== 2) continue

      const lon = coords[0]
      const lat = coords[1]

      // Filter invalid 0.0, 0.0 coordinates
      if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) continue

      const loc = getCachedReverseGeocode(lat, lon)
      if (!loc) continue

      const clusterKey = `${loc.city}__${loc.region}`
      let thumbUrl = ''
      try {
        if (typeof feat.properties?.thumbnail === 'string') {
          thumbUrl = JSON.parse(feat.properties.thumbnail).url
        } else if (feat.properties?.thumbnail?.url) {
          thumbUrl = feat.properties.thumbnail.url
        }
      } catch {}

      const mediaId = String(feat.properties?.media_id || '')

      if (!groups[clusterKey]) {
        groups[clusterKey] = {
          id: clusterKey,
          name: loc.city,
          region: loc.region,
          country: loc.country,
          coverUrl: thumbUrl,
          photoCount: 1,
          mediaIds: mediaId ? [mediaId] : [],
        }
      } else {
        groups[clusterKey].photoCount += 1
        if (mediaId) {
          groups[clusterKey].mediaIds.push(mediaId)
        }
        if (!groups[clusterKey].coverUrl && thumbUrl) {
          groups[clusterKey].coverUrl = thumbUrl
        }
      }
    }

    return Object.values(groups).sort((a, b) => b.photoCount - a.photoCount)
  }, [geoData?.myMediaGeoJson])

  // Filtered by search input
  const filteredCities = useMemo(() => {
    if (!searchFilter.trim()) return cityClusters
    const q = searchFilter.toLowerCase().trim()
    return cityClusters.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    )
  }, [cityClusters, searchFilter])

  // Total count
  const totalPhotosCount = useMemo(() => {
    return cityClusters.reduce((sum, c) => sum + c.photoCount, 0)
  }, [cityClusters])

  // When a city is selected, fetch its media items
  const handleSelectCity = (city: CityCluster) => {
    setSelectedCity(city)
    setActiveMediaIndex(null)
    loadMedia({
      variables: { mediaIDs: city.mediaIds },
    }).then(res => {
      setDetailedMedia((res.data?.mediaList || []) as MediaGalleryFields[])
    })
  }

  return (
    <Layout title={t('places_page.title', 'Places')}>
      <Helmet>
        <title>Places | Photoview</title>
      </Helmet>

      <PageContainer>
        {!selectedCity ? (
          <>
            <HeaderSection>
              <PageTitleGroup>
                <MainHeading>
                  <span>📍</span>
                  <span>{t('places_page.heading', 'Places & Locations')}</span>
                </MainHeading>
                <Subtitle>
                  {cityClusters.length} destinations • {totalPhotosCount} geotagged photos
                </Subtitle>
              </PageTitleGroup>

              <SearchInputWrapper>
                <SearchIcon>🔍</SearchIcon>
                <SearchInput
                  type="text"
                  placeholder="Filter cities or regions..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                />
              </SearchInputWrapper>
            </HeaderSection>

            {geoLoading && (
              <div className="py-20 text-center text-gray-400 text-sm">
                Discovering photo locations...
              </div>
            )}

            {!geoLoading && filteredCities.length === 0 && (
              <div className="py-20 text-center text-gray-400 text-sm">
                {searchFilter ? 'No matching destinations found' : 'No geotagged photos found in library'}
              </div>
            )}

            <CityGrid>
              {filteredCities.map(city => (
                <CityCard
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  title={`View photos from ${city.name}`}
                >
                  <CoverPhotoWrapper>
                    {city.coverUrl ? (
                      <CoverImage src={city.coverUrl} alt={city.name} loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                        📍
                      </div>
                    )}
                    <CountBadge>{city.photoCount} photos</CountBadge>
                  </CoverPhotoWrapper>
                  <CardInfo>
                    <CityName>{city.name}</CityName>
                    <RegionCountry>
                      {city.region ? `${city.region}, ${city.country}` : city.country}
                    </RegionCountry>
                  </CardInfo>
                </CityCard>
              ))}
            </CityGrid>
          </>
        ) : (
          <>
            {/* City Detail View */}
            <DetailHeader>
              <BackButton onClick={() => setSelectedCity(null)}>
                ← All Places
              </BackButton>
              <div>
                <MainHeading style={{ fontSize: '20px' }}>
                  <span>📍</span>
                  <span>{selectedCity.name}</span>
                </MainHeading>
                <Subtitle>
                  {selectedCity.region ? `${selectedCity.region}, ` : ''}
                  {selectedCity.country} • {selectedCity.photoCount} photos
                </Subtitle>
              </div>
            </DetailHeader>

            {mediaLoading && (
              <div className="py-20 text-center text-gray-400 text-sm">
                Loading photos from {selectedCity.name}...
              </div>
            )}

            <MediaGalleryGrid>
              {detailedMedia.map((m, idx) => (
                <MediaCard
                  key={m.id}
                  onClick={() => setActiveMediaIndex(idx)}
                  title={m.title || 'Photo'}
                >
                  <Thumbnail src={m.thumbnail?.url || ''} alt={m.title || ''} loading="lazy" />
                  {m.type === 'video' && (
                    <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-xs text-white">
                      🎬
                    </div>
                  )}
                </MediaCard>
              ))}
            </MediaGalleryGrid>
          </>
        )}
      </PageContainer>

      {/* Full-Screen Presentation Viewer */}
      {activeMediaIndex !== null && detailedMedia[activeMediaIndex] && (
        <PresentView
          activeMedia={detailedMedia[activeMediaIndex]}
          dispatchMedia={(action: any) => {
            if (action.type === 'closePresentMode') {
              setActiveMediaIndex(null)
            } else if (action.type === 'nextImage') {
              setActiveMediaIndex((prev) =>
                prev !== null && prev < detailedMedia.length - 1 ? prev + 1 : prev
              )
            } else if (action.type === 'previousImage') {
              setActiveMediaIndex((prev) =>
                prev !== null && prev > 0 ? prev - 1 : prev
              )
            }
          }}
          mediaList={detailedMedia}
          onSelectMedia={(_media, index) => {
            setActiveMediaIndex(index)
          }}
          disableSaveCloseInHistory={true}
        />
      )}
    </Layout>
  )
}

export default PlacesPage
