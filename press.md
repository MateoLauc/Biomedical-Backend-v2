import { useState, useEffect } from "react"

export interface PressItem {
  id: string
  category: string
  title: string
  description: string
  date: string
  image: string
}

export interface PressDetail extends PressItem {
  content: string // HTML content
  author?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
}

// Mock data for press items list
const mockPressItems: PressItem[] = [
  {
    id: "1",
    category: "Press Releases",
    title: "Biomedical Unveils Major Expansion to Strengthen Nigeria's Healthcare Supply Chain",
    description: "Biomedical Limited announces a significant expansion of its production facilities and distribution network to better serve healthcare facilities across Nigeria.",
    date: "October 26, 2023",
    image: "/assets/landing-page/press.png",
  },
  {
    id: "2",
    category: "News Articles",
    title: "Pharmaceutical Company Rolls Out Activities for 40th Anniversary in Nigeria",
    description: "Biomedical Limited, Nigeria's first pharmaceutical company to manufacture and distribute essential life-saving medications celebrates its 40th anniversary with a series of impactful initiatives.",
    date: "November 13, 2022",
    image: "/assets/landing-page/press.png",
  },
  {
    id: "3",
    category: "Press Releases",
    title: "New Partnership Aims to Improve Access to Essential Medicines in Rural Areas",
    description: "Biomedical Limited partners with local healthcare organizations to expand access to critical medications in underserved communities across Nigeria.",
    date: "March 15, 2024",
    image: "/assets/landing-page/press.png",
  },
]

// Mock data for press details with full HTML content
const mockPressDetails: Record<string, PressDetail> = {
  "1": {
    id: "1",
    category: "Press Releases",
    title: "Biomedical Unveils Major Expansion to Strengthen Nigeria's Healthcare Supply Chain",
    description: "Biomedical Limited announces a significant expansion of its production facilities and distribution network to better serve healthcare facilities across Nigeria.",
    date: "October 26, 2023",
    image: "/assets/landing-page/press.png",
    author: "Biomedical Communications Team",
    tags: ["Expansion", "Healthcare", "Supply Chain", "Nigeria"],
    seoTitle: "Biomedical Expansion: Strengthening Nigeria's Healthcare Supply Chain | Biomedical Limited",
    seoDescription: "Biomedical Limited announces major expansion to enhance production capacity and distribution networks, strengthening Nigeria's healthcare supply chain with improved access to essential medications.",
    content: `
      <p>Biomedical Limited, a leading pharmaceutical manufacturer in Nigeria, today announced a major expansion initiative designed to significantly strengthen the country's healthcare supply chain. This strategic investment will enhance production capacity, improve distribution networks, and ensure better access to essential medications across all regions of Nigeria.</p>
      
      <p>The expansion includes upgrades to existing production facilities, the establishment of new distribution centers in key regions, and the implementation of advanced quality assurance systems. These improvements will enable Biomedical to meet the growing demand for pharmaceutical products while maintaining the highest standards of quality and safety.</p>
      
      <blockquote>
        <p>"Our goal has always been to ensure that every healthcare facility in Nigeria has access to the products they need to save lives. This expansion allows us to meet that need more effectively and with even stronger quality assurance," a company spokesperson said.</p>
      </blockquote>
      
      <h2>The Upgraded Facility</h2>
      
      <p>The upgraded facility features state-of-the-art manufacturing equipment, enhanced quality control laboratories, and expanded storage capacity. These improvements will increase production output by approximately 40% while maintaining strict adherence to international quality standards.</p>
      
      <p>Key features of the expansion include:</p>
      <ul>
        <li>Advanced automated production lines for increased efficiency</li>
        <li>Enhanced cold chain storage facilities for temperature-sensitive products</li>
        <li>Expanded quality control laboratories with cutting-edge testing equipment</li>
        <li>Improved logistics and distribution infrastructure</li>
        <li>Training facilities for staff development and capacity building</li>
      </ul>
      
      <p>The expansion also includes significant investments in sustainable practices, including energy-efficient systems and waste reduction initiatives. These efforts align with Biomedical's commitment to environmental responsibility while maintaining operational excellence.</p>
      
      <blockquote>
        <p>"We're not just expanding our production; we're expanding our mission—to support healthier communities and a stronger healthcare system for all," the company stated.</p>
      </blockquote>
      
      <h2>Impact on Healthcare Delivery</h2>
      
      <p>This expansion is expected to have a profound impact on healthcare delivery across Nigeria. By increasing production capacity and improving distribution networks, Biomedical will be able to:</p>
      
      <ul>
        <li>Reduce lead times for essential medications</li>
        <li>Improve product availability in remote and underserved areas</li>
        <li>Support healthcare facilities with more reliable supply chains</li>
        <li>Contribute to better health outcomes for patients nationwide</li>
      </ul>
      
      <p>The company has also committed to working closely with healthcare providers, distributors, and regulatory bodies to ensure that the benefits of this expansion reach all corners of Nigeria. This collaborative approach will help address supply chain challenges and improve overall healthcare accessibility.</p>
      
      <p>Biomedical Limited remains committed to its mission of providing high-quality, affordable pharmaceutical products that improve health outcomes and strengthen Nigeria's healthcare infrastructure. This expansion represents a significant step forward in achieving these goals.</p>
    `,
  },
  "2": {
    id: "2",
    category: "News Articles",
    title: "Pharmaceutical Company Rolls Out Activities for 40th Anniversary in Nigeria",
    description: "Biomedical Limited, Nigeria's first pharmaceutical company to manufacture and distribute essential life-saving medications celebrates its 40th anniversary with a series of impactful initiatives.",
    date: "November 13, 2022",
    image: "/assets/landing-page/press.png",
    author: "Editorial Team",
    tags: ["Anniversary", "Milestone", "History", "Celebration"],
    seoTitle: "Biomedical Limited Celebrates 40 Years of Pharmaceutical Excellence in Nigeria",
    seoDescription: "Biomedical Limited marks 40 years of manufacturing and distributing essential medications in Nigeria with special anniversary activities and initiatives.",
    content: `
      <p>Biomedical Limited, Nigeria's pioneering pharmaceutical manufacturer, is celebrating four decades of service to the nation's healthcare sector. Founded in 1982, the company has grown from a small local manufacturer to one of the country's most trusted pharmaceutical companies.</p>
      
      <p>To mark this significant milestone, Biomedical has launched a series of anniversary activities that reflect its commitment to healthcare excellence and community engagement. These initiatives include health awareness campaigns, community outreach programs, and special recognition for long-serving employees and partners.</p>
      
      <h2>A Legacy of Innovation</h2>
      
      <p>Over the past 40 years, Biomedical Limited has been at the forefront of pharmaceutical manufacturing in Nigeria. The company was the first to produce many essential medications locally, reducing the country's dependence on imports and making critical treatments more accessible and affordable.</p>
      
      <p>Key achievements over the decades include:</p>
      <ul>
        <li>Production of over 200 different pharmaceutical products</li>
        <li>Establishment of robust quality assurance systems</li>
        <li>Development of strategic partnerships with healthcare providers</li>
        <li>Investment in research and development initiatives</li>
        <li>Training and capacity building for healthcare professionals</li>
      </ul>
      
      <blockquote>
        <p>"Forty years ago, we set out with a vision to make quality healthcare accessible to all Nigerians. Today, we're proud to have touched millions of lives through our products and services," said the company's CEO during the anniversary celebration.</p>
      </blockquote>
      
      <h2>Anniversary Activities</h2>
      
      <p>The anniversary celebration includes several impactful initiatives:</p>
      
      <ul>
        <li><strong>Health Awareness Campaigns:</strong> Educational programs focused on disease prevention and medication adherence</li>
        <li><strong>Community Health Screenings:</strong> Free health check-ups in underserved communities</li>
        <li><strong>Employee Recognition:</strong> Special awards for staff members who have contributed significantly to the company's success</li>
        <li><strong>Partnership Appreciation:</strong> Events to honor long-term partners and distributors</li>
        <li><strong>Charitable Initiatives:</strong> Donations of essential medications to healthcare facilities in need</li>
      </ul>
      
      <p>These activities reflect Biomedical's core values of excellence, integrity, and social responsibility. The company remains committed to its founding mission while adapting to meet the evolving needs of Nigeria's healthcare sector.</p>
      
      <h2>Looking Forward</h2>
      
      <p>As Biomedical Limited enters its fifth decade, the company is focused on continued innovation and expansion. Plans include investments in new product lines, advanced manufacturing technologies, and expanded distribution networks to reach even more communities across Nigeria.</p>
      
      <p>The company's leadership emphasizes that while celebrating past achievements, the focus remains on the future and the continued mission to improve healthcare outcomes for all Nigerians.</p>
    `,
  },
  "3": {
    id: "3",
    category: "Press Releases",
    title: "New Partnership Aims to Improve Access to Essential Medicines in Rural Areas",
    description: "Biomedical Limited partners with local healthcare organizations to expand access to critical medications in underserved communities across Nigeria.",
    date: "March 15, 2024",
    image: "/assets/landing-page/press.png",
    author: "Partnerships Team",
    tags: ["Partnership", "Rural Healthcare", "Access", "Community"],
    seoTitle: "Biomedical Partnership Improves Rural Access to Essential Medicines in Nigeria",
    seoDescription: "Biomedical Limited announces new partnership to expand access to essential medications in rural and underserved communities across Nigeria.",
    content: `
      <p>Biomedical Limited has announced a strategic partnership with leading healthcare organizations to improve access to essential medicines in rural and underserved communities across Nigeria. This initiative addresses a critical gap in healthcare delivery, ensuring that quality pharmaceutical products reach those who need them most.</p>
      
      <p>The partnership brings together Biomedical's manufacturing capabilities and distribution expertise with the local knowledge and community connections of partner organizations. Together, they will work to establish reliable supply chains and improve medication availability in areas that have historically faced challenges in accessing quality healthcare products.</p>
      
      <h2>Addressing Healthcare Disparities</h2>
      
      <p>Rural communities in Nigeria often face significant challenges in accessing essential medications. Factors such as limited transportation infrastructure, fewer healthcare facilities, and economic constraints can create barriers to obtaining necessary treatments. This partnership aims to address these challenges through a multi-faceted approach.</p>
      
      <blockquote>
        <p>"Access to quality medications should not be determined by where you live. This partnership represents our commitment to ensuring that all Nigerians, regardless of location, have access to the medications they need," said a Biomedical representative.</p>
      </blockquote>
      
      <h2>Partnership Components</h2>
      
      <p>The partnership includes several key components designed to improve medication access:</p>
      
      <ul>
        <li><strong>Distribution Network Expansion:</strong> Establishing new distribution points in rural areas to reduce travel distances for patients</li>
        <li><strong>Affordability Programs:</strong> Special pricing initiatives to make medications more accessible to low-income communities</li>
        <li><strong>Healthcare Provider Support:</strong> Training and resources for healthcare workers in rural facilities</li>
        <li><strong>Community Education:</strong> Programs to raise awareness about medication availability and proper usage</li>
        <li><strong>Supply Chain Optimization:</strong> Improved logistics to ensure consistent product availability</li>
      </ul>
      
      <h2>Expected Impact</h2>
      
      <p>This partnership is expected to have a significant positive impact on healthcare outcomes in rural communities. By improving access to essential medications, the initiative aims to:</p>
      
      <ul>
        <li>Reduce treatment delays and improve patient outcomes</li>
        <li>Support healthcare providers with reliable medication supplies</li>
        <li>Increase medication adherence through improved accessibility</li>
        <li>Contribute to better overall health in underserved communities</li>
      </ul>
      
      <p>The partnership will initially focus on specific regions with identified access challenges, with plans to expand to additional areas based on initial results and community needs. Regular monitoring and evaluation will ensure that the initiative remains responsive to local healthcare requirements.</p>
      
      <h2>Long-term Commitment</h2>
      
      <p>This partnership represents a long-term commitment to improving rural healthcare access. Biomedical and its partners are dedicated to sustainable solutions that will continue to benefit communities for years to come. The initiative includes plans for ongoing support, capacity building, and continuous improvement based on feedback from healthcare providers and patients.</p>
      
      <p>By working together, Biomedical and its partners aim to create a model for improving medication access that can be replicated in other underserved areas, ultimately contributing to a more equitable healthcare system across Nigeria.</p>
    `,
  },
}

export function usePress() {
  const [pressItems, setPressItems] = useState<PressItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with actual API call later
    const fetchPressItems = async () => {
      setLoading(true)
      
      // Mock data - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
      
      setPressItems(mockPressItems)
      setLoading(false)
    }

    fetchPressItems()
  }, [])

  return { pressItems, loading }
}

// Hook to fetch a single press item by ID
export function usePressItem(id: string) {
  const [pressItem, setPressItem] = useState<PressDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call - replace with actual API call later
    const fetchPressItem = async () => {
      setLoading(true)
      setError(null)
      
      // Mock data - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
      
      const item = mockPressDetails[id]
      if (item) {
        setPressItem(item)
      } else {
        setError("Press item not found")
      }
      
      setLoading(false)
    }

    if (id) {
      fetchPressItem()
    }
  }, [id])

  return { pressItem, loading, error }
}
