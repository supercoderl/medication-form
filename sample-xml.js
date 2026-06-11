// XML mẫu - PHIẾU THEO DÕI ĐIỀU TRỊ (để trang web có dữ liệu sẵn khi mở lần đầu)
window.SAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:sdtc="urn:hl7-org:sdtc">
  <code code="34109-9" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Treatment Follow-up Note"/>
  <title>PHIẾU THEO DÕI ĐIỀU TRỊ</title>
  <component>
    <structuredBody>
      <component>
        <section>
          <code code="47519-4" codeSystem="2.16.840.1.113883.6.1" displayName="History of Treatment Follow-up"/>
          <title>PHIẾU THEO DÕI ĐIỀU TRỊ</title>
          <text>
            <paragraph>Cơ sở KB, CB: #tencongty#</paragraph>
            <paragraph>Khoa: #khoa#</paragraph>

            <paragraph styleCode="Bold Center">PHIẾU THEO DÕI ĐIỀU TRỊ</paragraph>
            <paragraph>MS: 36-BV2</paragraph>
            <paragraph>Số sổ: #sovaovien#</paragraph>
            <paragraph>Mã người bệnh: #benhnhan_ma#</paragraph>

            <paragraph>Họ và tên người bệnh: #tenbenhnhan#&#160;&#160;&#160;Tuổi: #benhnhan_tuoi#</paragraph>
            <paragraph>
              Giới tính:
              <content styleCode="checkbox">#benhnhan_gioitinh_namcheck#</content> Nam &#160;&#160;
              <content styleCode="checkbox">#benhnhan_gioitinh_nucheck#</content> Nữ
            </paragraph>
            <paragraph>Khoa: #khoa#&#160;&#160;&#160;Phòng: #phong#&#160;&#160;&#160;Giường: #giuong#</paragraph>
            <paragraph>Chẩn đoán: #khambenh_chandoan# #chandoan_ICD#</paragraph>
            <paragraph>Chẩn đoán phân biệt: #khambenh_chandoan_phanbiet#</paragraph>
            <list>
              <item>#quatrinh_dieutri#</item>
            </list>

            <paragraph styleCode="Bold">Ghi chú:</paragraph>
            <paragraph styleCode="Italics">Bác sỹ ký ngay sau mỗi lần ghi chép trong phần "Diễn biến bệnh" hoặc "Chỉ định".</paragraph>
          </text>

          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-HOSPITAL-NAME" codeSystem="1.3.6.1.4.1.55555.1" displayName="Tên bệnh viện" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#tencongty#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-WARD-NAME" codeSystem="1.3.6.1.4.1.55555.1" displayName="Tên khoa điều trị" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#khoa#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-MEDICAL-RECORD-NUMBER" codeSystem="1.3.6.1.4.1.55555.1" displayName="Số sổ YT" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#sovaovien#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-PATIENT-CODE" codeSystem="1.3.6.1.4.1.55555.1" displayName="Mã người bệnh" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#benhnhan_ma#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-PATIENT-FULLNAME" codeSystem="1.3.6.1.4.1.55555.1" displayName="Họ và tên người bệnh" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#tenbenhnhan#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-PATIENT-AGE" codeSystem="1.3.6.1.4.1.55555.1" displayName="Tuổi" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#benhnhan_tuoi#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-GENDER-MALE" codeSystem="1.3.6.1.4.1.55555.1" displayName="Giới tính Nam" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="BL" value="#benhnhan_gioitinh_namcheck#"/>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-GENDER-FEMALE" codeSystem="1.3.6.1.4.1.55555.1" displayName="Giới tính Nữ" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="BL" value="#benhnhan_gioitinh_nucheck#"/>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-ROOM-NUMBER" codeSystem="1.3.6.1.4.1.55555.1" displayName="Số phòng" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#phong#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-BED-NUMBER" codeSystem="1.3.6.1.4.1.55555.1" displayName="Số giường" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#giuong#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-ICD-NAME" codeSystem="1.3.6.1.4.1.55555.1" displayName="Tên ICD" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#khambenh_chandoan#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-ICD-CODE" codeSystem="1.3.6.1.4.1.55555.1" displayName="Mã ICD" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#chandoan_ICD#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-DIFFERENTIAL-DIAGNOSIS" codeSystem="1.3.6.1.4.1.55555.1" displayName="Chẩn đoán phân biệt" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#khambenh_chandoan_phanbiet#</value>
          </observation></entry>
          <entry><observation classCode="OBS" moodCode="EVN">
            <code code="VN-TREATMENT-PROCESS" codeSystem="1.3.6.1.4.1.55555.1" displayName="Quá trình điều trị" codeSystemName="VN-LOCAL"/>
            <statusCode code="completed"/><value xsi:type="ST">#quatrinh_dieutri#</value>
          </observation></entry>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`;
