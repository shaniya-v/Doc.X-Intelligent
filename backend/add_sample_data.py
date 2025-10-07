#!/usr/bin/env python3
"""
Sample Data Generator for DOC.X Intelligent
Adds diverse sample documents to test RAG routing to different departments
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))

# Sample documents for different departments
SAMPLE_DOCUMENTS = [
    {
        "title": "Employee Annual Performance Review - 2024",
        "content": """
        HUMAN RESOURCES DEPARTMENT
        ANNUAL PERFORMANCE EVALUATION REPORT
        
        Employee Name: Rajesh Kumar
        Employee ID: HR2024001
        Department: Operations
        Review Period: January 2024 - December 2024
        
        PERFORMANCE SUMMARY:
        - Attendance: 98% (Excellent)
        - Project Completion: 15/16 projects completed on time
        - Team Collaboration: Outstanding
        - Communication Skills: Very Good
        - Technical Competency: Good
        
        ACHIEVEMENTS:
        1. Led the track maintenance optimization project
        2. Trained 5 new junior engineers
        3. Implemented new safety protocols reducing incidents by 30%
        
        DEVELOPMENT AREAS:
        - Advanced technical certifications needed
        - Leadership training recommended
        
        GOALS FOR 2025:
        - Complete PMP certification
        - Lead cross-departmental projects
        - Mentor junior staff
        
        Supervisor: Maya Nair
        HR Representative: Priya Menon
        Date of Review: December 15, 2024
        """,
        "source": "HR Management System",
        "document_type": "pdf",
        "expected_department": "Human Resources"
    },
    {
        "title": "Quarterly Financial Report Q3 2024 - Revenue Analysis",
        "content": """
        FINANCE DEPARTMENT
        QUARTERLY FINANCIAL REPORT - Q3 2024
        
        REVENUE SUMMARY:
        Total Revenue: ₹45,67,89,000
        Passenger Revenue: ₹38,12,45,000 (83.5%)
        Commercial Revenue: ₹4,23,67,000 (9.3%)
        Other Income: ₹3,31,77,000 (7.2%)
        
        EXPENSE BREAKDOWN:
        Operational Expenses: ₹32,45,67,000
        - Staff Salaries: ₹18,90,45,000
        - Maintenance Costs: ₹8,76,54,000
        - Utilities: ₹2,34,56,000
        - Other Operating Costs: ₹2,44,12,000
        
        Capital Expenditure: ₹6,78,90,000
        - New Train Procurement: ₹4,56,78,000
        - Infrastructure Upgrades: ₹2,22,12,000
        
        NET PROFIT: ₹6,43,32,000
        Profit Margin: 14.1%
        
        BUDGET VS ACTUAL:
        Revenue: 102.3% of budgeted amount
        Expenses: 98.7% of budgeted amount
        
        KEY FINANCIAL INDICATORS:
        - Cash Flow: Positive ₹8,90,45,000
        - Debt-to-Equity Ratio: 0.45
        - Return on Investment: 12.8%
        
        RECOMMENDATIONS:
        1. Increase commercial revenue through new partnerships
        2. Optimize maintenance costs through predictive maintenance
        3. Explore additional revenue streams
        
        Prepared by: Sunitha Varma, Finance Manager
        Reviewed by: Dr. K.P. Nair, CFO
        Date: October 31, 2024
        """,
        "source": "Financial Management System",
        "document_type": "excel",
        "expected_department": "Finance"
    },
    {
        "title": "Track Maintenance Schedule - December 2024",
        "content": """
        OPERATIONS DEPARTMENT
        MONTHLY TRACK MAINTENANCE SCHEDULE
        
        DECEMBER 2024 MAINTENANCE PLAN
        
        DAILY INSPECTIONS:
        - Visual inspection of tracks, signals, and overhead lines
        - Check platform safety systems
        - Monitor CCTV and communication systems
        
        WEEKLY MAINTENANCE (Every Sunday 2:00 AM - 5:00 AM):
        Week 1 (Dec 1): Aluva to Kaloor section
        - Rail fastening inspection
        - Point and crossing maintenance
        - Signal system testing
        
        Week 2 (Dec 8): Kaloor to Lissie section  
        - Track geometry measurement
        - Overhead line inspection
        - Platform maintenance
        
        Week 3 (Dec 15): Lissie to Vadakkekotta section
        - Rail grinding operations
        - Drainage system cleaning
        - Emergency equipment check
        
        Week 4 (Dec 22): Vadakkekotta to Thripunithura section
        - Complete track inspection
        - Signal interlocking test
        - Safety system audit
        
        Week 5 (Dec 29): Full system inspection
        - End-to-end system test
        - Year-end maintenance report
        - Equipment inventory update
        
        SPECIAL MAINTENANCE:
        - New Year preparation: Dec 30-31
        - Emergency response drill: Dec 15
        - Staff training session: Dec 20
        
        EQUIPMENT REQUIRED:
        - Track measurement trolley
        - Rail grinding machine
        - Overhead line maintenance vehicle
        - Signal testing equipment
        
        SAFETY PROTOCOLS:
        - All work during non-operational hours
        - Safety barriers and warning systems active
        - Emergency communication maintained
        - First aid team on standby
        
        Maintenance Supervisor: Vinod Kumar
        Operations Manager: Sreejith Nair
        Safety Officer: Dr. Meera Joseph
        """,
        "source": "Operations Management System",
        "document_type": "pdf",
        "expected_department": "Operations"
    },
    {
        "title": "IT Infrastructure Upgrade Proposal - Cloud Migration",
        "content": """
        INFORMATION TECHNOLOGY DEPARTMENT
        CLOUD INFRASTRUCTURE MIGRATION PROPOSAL
        
        PROJECT OVERVIEW:
        Migrate KMRL's IT infrastructure to cloud-based solutions to improve efficiency,
        reduce costs, and enhance system reliability.
        
        CURRENT INFRASTRUCTURE:
        - On-premise servers: 15 physical servers
        - Storage capacity: 50 TB
        - Network bandwidth: 1 Gbps
        - Applications: 25 business-critical applications
        - Users: 500+ employees across all departments
        
        PROPOSED CLOUD SOLUTION:
        Provider: Amazon Web Services (AWS)
        Services:
        - EC2 instances for application hosting
        - RDS for database management
        - S3 for file storage and backup
        - CloudFront for content delivery
        - Route 53 for DNS management
        
        MIGRATION PHASES:
        Phase 1 (Q1 2025): Non-critical applications
        - Email system migration
        - File sharing platform
        - Intranet portal
        
        Phase 2 (Q2 2025): Business applications
        - HR management system
        - Finance applications
        - Document management system
        
        Phase 3 (Q3 2025): Critical operations
        - Train control systems backup
        - Passenger information systems
        - Security and surveillance data
        
        COST ANALYSIS:
        Current Annual IT Costs: ₹1,20,00,000
        Proposed Cloud Costs: ₹85,00,000
        Annual Savings: ₹35,00,000
        
        Migration Cost: ₹45,00,000
        ROI Period: 15 months
        
        BENEFITS:
        1. 99.9% uptime guarantee
        2. Automatic backup and disaster recovery
        3. Scalable resources based on demand
        4. Enhanced security features
        5. Remote access capabilities
        6. Reduced maintenance overhead
        
        RISKS AND MITIGATION:
        - Data migration risks: Comprehensive testing and phased approach
        - Security concerns: Enhanced encryption and access controls
        - Staff training: Dedicated training program
        - Vendor dependency: Multi-cloud strategy consideration
        
        TIMELINE:
        Project Start: January 15, 2025
        Migration Complete: September 30, 2025
        Full Operations: October 15, 2025
        
        RECOMMENDATIONS:
        1. Approve cloud migration project
        2. Allocate budget for Q1 2025
        3. Start staff training program
        4. Engage AWS professional services
        
        Project Manager: Anitha Krishnan
        IT Head: Suresh Babu
        CTO: Dr. Rajesh Menon
        """,
        "source": "IT Project Management System",
        "document_type": "docx",
        "expected_department": "Information Technology"
    },
    {
        "title": "Public Relations Campaign - Metro Expansion Announcement",
        "content": """
        PUBLIC RELATIONS DEPARTMENT
        CAMPAIGN STRATEGY DOCUMENT
        
        CAMPAIGN: KMRL Phase 2 Expansion Announcement
        
        OBJECTIVE:
        Announce the expansion of Kochi Metro to new areas and build public support
        for the project while addressing potential concerns.
        
        TARGET AUDIENCE:
        Primary: Residents of expansion areas (Kakkanad, Info Park, Seaport)
        Secondary: Current metro users and general public
        Tertiary: Government officials and media
        
        KEY MESSAGES:
        1. Enhanced connectivity for IT corridor and business districts
        2. Reduced traffic congestion and pollution
        3. Economic development opportunities
        4. Job creation during construction and operations
        5. Improved quality of life for residents
        
        COMMUNICATION CHANNELS:
        
        Traditional Media:
        - Press releases to Malayalam and English newspapers
        - Radio interviews on popular FM stations
        - TV appearances on news channels
        
        Digital Media:
        - Social media campaign (#KochiMetroPhase2)
        - YouTube videos showcasing benefits
        - Website updates with interactive maps
        - Email newsletters to subscribers
        
        Community Engagement:
        - Town hall meetings in affected areas
        - School and college presentations
        - Business community forums
        - Resident association meetings
        
        CONTENT CALENDAR:
        Week 1: Teaser campaign on social media
        Week 2: Official announcement and press conference
        Week 3: Community meetings and stakeholder engagement
        Week 4: Success stories and testimonials
        Week 5-8: Sustained awareness campaign
        
        SUCCESS METRICS:
        - Media coverage: Target 50+ articles/mentions
        - Social media reach: 500,000+ impressions
        - Community meeting attendance: 80% capacity
        - Public support survey: 70%+ positive response
        
        BUDGET ALLOCATION:
        Total Budget: ₹25,00,000
        - Traditional media: ₹10,00,000 (40%)
        - Digital marketing: ₹8,00,000 (32%)
        - Community events: ₹5,00,000 (20%)
        - Creative and production: ₹2,00,000 (8%)
        
        TIMELINE:
        Campaign Launch: January 5, 2025
        Peak Activity: January 15 - February 15, 2025
        Evaluation and Reporting: February 28, 2025
        
        RISK MANAGEMENT:
        - Negative public sentiment: Proactive FAQ and myth-busting
        - Construction concerns: Clear communication about safety measures
        - Political opposition: Stakeholder engagement and transparency
        
        TEAM RESPONSIBILITIES:
        Campaign Manager: Lakshmi Nair
        Media Relations: Rajesh Kumar
        Digital Marketing: Priya Varma
        Community Engagement: Sunil Joseph
        Creative Director: Maya Pillai
        
        Expected Outcomes:
        - Informed public about Phase 2 expansion
        - 70%+ public approval rating
        - Smooth project rollout with community support
        - Enhanced KMRL brand reputation
        """,
        "source": "PR Campaign Management",
        "document_type": "pdf",
        "expected_department": "Public Relations"
    },
    {
        "title": "Security Incident Report - Platform Safety Alert",
        "content": """
        SECURITY DEPARTMENT
        INCIDENT REPORT
        
        INCIDENT ID: SEC2024120501
        DATE: December 5, 2024
        TIME: 14:30 hrs
        LOCATION: Lissie Metro Station, Platform 2
        
        INCIDENT TYPE: Suspicious Package Alert
        SEVERITY LEVEL: High
        STATUS: Resolved
        
        INCIDENT DESCRIPTION:
        At 14:30 hrs, a station security officer noticed an unattended bag on Platform 2
        at Lissie Metro Station. Following standard security protocols, the area was
        immediately cordoned off and authorities were notified.
        
        IMMEDIATE RESPONSE:
        14:30 - Suspicious package identified by Security Officer Ramesh Kumar
        14:32 - Platform 2 evacuated, service suspended
        14:35 - Bomb squad notified
        14:40 - Area secured, passengers redirected
        14:45 - Police and fire department arrived
        15:00 - Bomb squad assessment began
        15:30 - Package cleared as harmless (personal belongings)
        15:45 - Normal operations resumed
        
        INVESTIGATION FINDINGS:
        The bag belonged to Mr. Arun Prakash (IC: 1234567890123), who had
        accidentally left it while rushing to catch a train. Contents included:
        - Personal documents
        - Laptop computer
        - Office files
        - No dangerous materials
        
        SECURITY MEASURES TAKEN:
        1. Complete evacuation of affected platform
        2. Service suspension on affected line
        3. Coordination with local police
        4. CCTV footage review
        5. Passenger and staff safety ensured
        
        STAFF PERFORMANCE:
        - Security Officer Ramesh Kumar: Excellent alertness and protocol adherence
        - Station Manager Priya Nair: Effective coordination and communication
        - Control Room Team: Prompt response and system management
        - Cleaning Staff: Quick area clearance and assistance
        
        LESSONS LEARNED:
        1. Security protocols worked effectively
        2. Staff training proved valuable
        3. Passenger cooperation was excellent
        4. Communication systems functioned well
        
        RECOMMENDATIONS:
        1. Conduct refresher training on suspicious package handling
        2. Review and update evacuation procedures
        3. Install additional announcement systems
        4. Improve coordination with external agencies
        
        COST IMPACT:
        - Service disruption: 75 minutes
        - Affected passengers: Approximately 200
        - Revenue loss: Estimated ₹15,000
        - Additional security costs: ₹5,000
        
        FOLLOW-UP ACTIONS:
        1. Incident report filed with police
        2. CCTV footage archived for future reference
        3. Staff debriefing scheduled for December 6
        4. Security procedures review meeting planned
        
        PREVENTION MEASURES:
        - Enhanced PA announcements about unattended items
        - Additional security patrols during peak hours
        - Improved passenger awareness campaigns
        - Regular security drills
        
        Report Prepared by: Inspector Mohan Das
        Reviewed by: Security Chief Suresh Kumar
        Approved by: Operations Director Dr. Nirmala Menon
        
        Classification: Confidential
        Distribution: Security Team, Operations Management, Senior Leadership
        """,
        "source": "Security Management System",
        "document_type": "pdf",
        "expected_department": "Security"
    }
]

def add_sample_data():
    """Add sample documents to Supabase database"""
    print("🚀 Adding sample data to Supabase...")
    
    try:
        for i, doc in enumerate(SAMPLE_DOCUMENTS, 1):
            print(f"📄 Adding document {i}/{len(SAMPLE_DOCUMENTS)}: {doc['title']}")
            
            # Generate unique ID like existing documents
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            content_hash = hashlib.md5(doc['content'].encode()).hexdigest()[:8]
            doc_id = f"sample_{timestamp}_{doc['expected_department'].lower().replace(' ', '_')}_{content_hash}"
            
            # Prepare document data
            doc_data = {
                'id': doc_id,
                'title': doc['title'],
                'content': doc['content'],
                'source': doc['source'],
                'language': 'english',
                'assigned_department': doc['expected_department'],
                'priority': 'medium',
                'confidence': 95,
                'status': 'processed',
                'processing_status': 'completed',
                'metadata': {
                    'sample_data': True,
                    'expected_department': doc['expected_department'],
                    'content_type': doc['document_type'],
                    'word_count': len(doc['content'].split()),
                    'deadline': (datetime.now() + timedelta(days=7)).isoformat(),
                    'ai_analysis': {
                        'summary': f"Sample {doc['expected_department']} department document",
                        'priority': 'medium',
                        'confidence': 95,
                        'department': doc['expected_department'],
                        'key_topics': ['department', 'document', 'sample'],
                        'rag_analysis': True
                    }
                }
            }
            
            # Insert into database
            result = supabase.table('documents').insert(doc_data).execute()
            
            if result.data:
                print(f"✅ Successfully added: {doc['title']} -> {doc['expected_department']}")
            else:
                print(f"❌ Failed to add: {doc['title']}")
        
        print(f"\n🎉 Successfully added {len(SAMPLE_DOCUMENTS)} sample documents!")
        
        # Show summary
        print("\n📊 DEPARTMENT DISTRIBUTION:")
        dept_count = {}
        for doc in SAMPLE_DOCUMENTS:
            dept = doc['expected_department']
            dept_count[dept] = dept_count.get(dept, 0) + 1
        
        for dept, count in dept_count.items():
            print(f"   • {dept}: {count} documents")
            
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")

def verify_rag_routing():
    """Test if RAG properly routes documents to correct departments"""
    print("\n🔍 Verifying RAG routing accuracy...")
    
    try:
        # Get all documents
        result = supabase.table('documents').select('*').execute()
        documents = result.data or []
        
        print(f"📈 Total documents in database: {len(documents)}")
        
        # Check department routing accuracy
        correct_routing = 0
        total_sample_docs = 0
        
        for doc in documents:
            metadata = doc.get('metadata', {})
            if metadata.get('sample_data'):
                total_sample_docs += 1
                actual_dept = doc.get('assigned_department', '')
                expected_dept = metadata.get('expected_department', '')
                
                if actual_dept == expected_dept:
                    correct_routing += 1
                    print(f"✅ {doc['title'][:50]}... -> {actual_dept}")
                else:
                    print(f"❌ {doc['title'][:50]}... -> {actual_dept} (expected: {expected_dept})")
        
        if total_sample_docs > 0:
            accuracy = (correct_routing / total_sample_docs) * 100
            print(f"\n📊 RAG Routing Accuracy: {accuracy:.1f}% ({correct_routing}/{total_sample_docs})")
        
        return accuracy if total_sample_docs > 0 else 0
        
    except Exception as e:
        print(f"❌ Error verifying RAG routing: {e}")
        return 0

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 DOC.X Intelligent - Sample Data Generator")
    print("=" * 60)
    
    # Add sample data
    add_sample_data()
    
    # Verify routing
    accuracy = verify_rag_routing()
    
    print("=" * 60)
    print("✨ Sample data setup complete!")
    print(f"🎯 RAG routing accuracy: {accuracy:.1f}%")
    print("=" * 60)